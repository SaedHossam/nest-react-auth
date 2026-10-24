# nest-react-auth

Full-stack authentication module: sign up, sign in and a protected application page.

| Part | Stack | Path |
|---|---|---|
| API | NestJS 11, MongoDB (Mongoose), JWT in an httpOnly cookie | [`apps/api`](apps/api) |
| Web | React + TypeScript (Vite) | [`apps/web`](apps/web) |

## Prerequisites

- Node.js 20+ (developed on 24) and npm
- Docker (for MongoDB), or any MongoDB 6+ you can point `MONGODB_URI` at

## Quick start

```bash
# 1. Start MongoDB
docker compose up -d mongo

# 2. Configure and run the API (http://localhost:3000)
cd apps/api
cp .env.example .env        # then set JWT_SECRET to a long random value
npm ci
npm run start:dev

# 3. In a second terminal, run the web app (http://localhost:5173)
cd apps/web
npm ci
npm run dev
```

- Web app: http://localhost:5173 (the Vite dev server proxies `/api` to the API, so the session cookie is same-origin)
- API docs (Swagger UI): http://localhost:3000/api/docs
- Health check: http://localhost:3000/api/health

## Web app

| Route | Access | What it shows |
|---|---|---|
| `/signup` | Signed-out only | Email, name and password form with a live password checklist |
| `/signin` | Signed-out only | Email and password form |
| `/` | **Signed-in only** | "Welcome to the application." and a logout button |

- **Validation:** zod schemas mirror the API rules for instant feedback; the API remains the source of truth, and its errors are shown under the matching field (e.g. a duplicate email) or as a form-level alert.
- **Session:** the app never sees the token. It asks `GET /api/users/me` who is signed in (cached with TanStack Query); a 401 means signed out.
- **Routing:** `RequireAuth` and `GuestOnly` guards are the only place that redirects. After signing in, users return to the page they originally requested (in-app paths only, no open redirects).
- **Accessibility:** labelled inputs, errors linked with `aria-describedby` and announced, focus moves to the first invalid field, keyboard-friendly show/hide password.

## API

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | Public | Create an account; sets the session cookie |
| `POST` | `/auth/signin` | Public | Sign in; sets the session cookie |
| `POST` | `/auth/logout` | Public | Clear the session cookie |
| `GET` | `/users/me` | **Protected** | The signed-in user |
| `GET` | `/health` | Public | Liveness + MongoDB ping |

### Field rules (sign up)

| Field | Rule |
|---|---|
| `email` | Valid email; trimmed and stored lowercase; must be unique |
| `name` | 3–50 characters after trimming |
| `password` | 8–128 characters, at least one letter, one number and one special character |

Validation errors list every failed rule at once. All errors share one shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["Password must contain at least one number."],
  "path": "/api/auth/signup",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "requestId": "6f1c..."
}
```

### Example

```bash
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","name":"Jane","password":"Passw0rd!"}' \
  http://localhost:3000/api/auth/signup

curl -b cookies.txt http://localhost:3000/api/users/me
```

## Configuration

Set in `apps/api/.env` (see [`.env.example`](apps/api/.env.example)). The API validates these at startup and refuses to boot if any are invalid.

| Variable | Default | Notes |
|---|---|---|
| `MONGODB_URI` | — | Required |
| `JWT_SECRET` | — | Required, 32+ chars. `openssl rand -base64 48` |
| `JWT_EXPIRES_IN_SECONDS` | `3600` | Session lifetime |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
| `COOKIE_SAMESITE` | `lax` | Use `none` only for cross-site deployments (forces `Secure`) |
| `SWAGGER_ENABLED` | `true` | Serve `/api/docs` |
| `PORT` | `3000` | |
| `NODE_ENV` | `development` | `production` enables `Secure` cookies and JSON logs |
| `LOG_LEVEL` | `info` | `fatal` … `trace` |

## Security notes

- **Passwords** are hashed with argon2id; the hash is excluded from queries by default and never returned.
- **Sessions** use a short-lived HS256 JWT in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production), so page scripts cannot read it. A `Bearer` header is also accepted for API clients.
- **Secure by default:** a global guard protects every route; public routes opt out with `@Public()`.
- **No account enumeration on sign in:** unknown emails and wrong passwords return the same message and take the same time.
- **Rate limiting:** 10 requests/minute per IP on sign up and sign in, 100/minute elsewhere.
- **Input hardening:** unknown request fields are rejected (no mass assignment), Helmet sets security headers, and CORS only allows configured origins.
- **Logging:** structured JSON logs with request IDs (`x-request-id`); `Authorization` and cookie headers are redacted.

### Known limitations / next steps

- Logout clears the cookie, but tokens are stateless: a copied token stays valid until it expires. Next step: short access tokens plus rotating refresh tokens stored server-side, or a token denylist.
- Rate limits are kept in memory per instance; use a shared store (e.g. Redis) when running several replicas.
- Behind a reverse proxy, enable Express `trust proxy` so rate limiting sees real client IPs.

## Development

### Web (`apps/web`)

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit + integration tests (Vitest, Testing Library) |
| `npm run lint` / `npm run typecheck` | Static checks (oxlint, `tsc`) |
| `npm run build` && `npm run preview` | Production build |

Integration tests render the real route tree against an in-memory fake API, covering sign up, sign in (including returning to the requested page), validation, duplicate email, guards and logout.

Environment (optional, see [`apps/web/.env.example`](apps/web/.env.example)): `API_PROXY_TARGET` (dev proxy target, default `http://localhost:3000`) and `VITE_API_BASE_URL` (default same-origin `/api`).

### API (`apps/api`)

| Command | Purpose |
|---|---|
| `npm run start:dev` | Watch mode |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against an in-memory MongoDB (no Docker needed) |
| `npm run test:cov` | Unit test coverage |
| `npm run lint:check` / `npm run typecheck` | Static checks |
| `npm run build` && `npm run start:prod` | Production build |

The first `npm run test:e2e` downloads a MongoDB binary for `mongodb-memory-server`, which can take a few minutes.

### Project layout (API)

```
apps/api/src
├── auth/        # sign up / sign in / logout, JWT guard, cookie handling, DTOs
├── users/       # user schema, service, protected /users/me
├── health/      # /health with MongoDB ping
├── common/      # global exception filter, shared DTOs
├── config/      # env validation, logger config
├── setup-app.ts # HTTP middleware shared by main.ts and e2e tests
└── swagger.ts   # OpenAPI docs
```

### Project layout (web)

```
apps/web/src
├── features/auth/   # pages, route guards, hooks, zod schemas, API calls
├── components/ui/   # Button, TextField, PasswordField, Alert, Card, Spinner
├── pages/           # application page, 404
├── lib/             # fetch client, query client
├── test/            # test setup, fake API, render helper
└── router.tsx       # route tree
```

## AI usage

See [AI.md](AI.md).
