# AI usage

This project was built with Claude Code (Claude Opus 5.5) as a pair programmer. This file is kept up to date as the work progresses, not written after the fact.

## How the work was split

| Part | AI-assisted? | Notes |
|---|---|---|
| Requirements breakdown and plan | Yes | Plan reviewed and approved before any code was written |
| API foundation (config, logging, error filter, health) | Yes | Generated, then verified by booting against a real Mongo and checking headers/error shape with curl |
| Auth (signup/signin/logout, JWT cookie, guard, `/users/me`) | Yes | Every behaviour smoke-tested with curl before committing |
| Swagger docs | Yes | Checked the generated spec and that the UI renders under Helmet's CSP |
| Unit + e2e tests | Yes | Test cases chosen deliberately (enumeration, mass assignment, every password rule); two real bugs surfaced while making them pass |
| README | Yes | Reviewed against the actual commands and env vars |

## Prompts and approaches that worked

- Feeding the task PDF directly and asking for a plan with explicit trade-offs before writing code.
- Asking for "secure by default" explicitly: a global auth guard with an opt-out `@Public()` decorator, rather than remembering to protect each new route.
- Smoke-testing every branch against a real database (curl + mongosh) instead of trusting that compiling code is correct. This caught the validation bug below.

## What had to be corrected or reworked

- **Mixed major versions.** The first install pulled `@nestjs/config`, `@nestjs/mongoose`, `@nestjs/terminus` and `@nestjs/jwt` v12, which are ESM-only, into a NestJS 11 (CommonJS) app. It ran under Node 24's `require(esm)`, so nothing failed immediately, but it would have broken Jest and mixed two framework generations. Pinned all of them to the v11-compatible CommonJS releases.
- **Password rules hid each other.** The first DTO stacked three `@Matches` decorators (letter, number, special). class-validator keys failures by constraint name, so they all collapsed into one `matches` entry and only one message came back. A user missing a number *and* a special character would fix one, resubmit, and only then learn about the other. Replaced with a small `@MatchesRule(name, regex, message)` decorator so each rule reports separately.
- **Unique index could be missing.** An e2e test showed a duplicate sign up being accepted. The immediate cause was the test helper dropping the database (and with it the index) after startup. It also exposed a real gap: Mongoose builds indexes in the background, so a fresh production database could briefly accept duplicates. `UsersService` now awaits `Model.init()` on startup, and the helper clears documents instead of dropping the database.
- **E2E tests could not reach MongoDB.** The first attempt failed with a cryptic server error, `Missing required sub-document 'driver' in the client metadata document`. Digging into the driver showed that MongoDB driver 7 loads its `os` adapter with a dynamic `import()`. Jest's CommonJS runtime cannot run that without `--experimental-vm-modules`, so the driver silently fell back to empty handshake metadata, which MongoDB 8 rejects. Fixed in the test script (`node --experimental-vm-modules …`) rather than patching app code; one shared in-memory MongoDB is started in Jest `globalSetup`.
- **Vulnerable transitive dependency.** `@nestjs/platform-express` pins `multer@2.4.0` (GHSA-q7qp-rjg7-q26m), which `npm audit fix` cannot resolve. Added an npm `overrides` entry for `2.5.0`.

## Decisions made differently from the AI's first suggestion

- **No Passport.** A ~40-line guard that verifies the JWT from the cookie (or a Bearer header) is easier to read and test than a Passport strategy plus guard for a single auth method.
- **Single access token, no refresh tokens.** Refresh-token rotation is the more complete design, but it adds about an hour. Instead: short-lived token (1h) in an httpOnly cookie, with refresh tokens listed in the README as the next step.
- **Swagger via the CLI plugin**, not hand-written `@ApiProperty` on every field. The plugin reads the class-validator rules and JSDoc comments, so the docs can't drift from the validation.
- **Duplicate email returns 409.** This technically lets someone check whether an email is registered. Accepted for usability, since sign up is rate-limited. Sign in, by contrast, returns the same message and takes the same time for unknown emails and wrong passwords.
