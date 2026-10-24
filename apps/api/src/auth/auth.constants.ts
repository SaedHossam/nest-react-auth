export const ACCESS_TOKEN_COOKIE = 'access_token';

/** Field rules shared by the sign-up DTO. The web app mirrors these in its zod schema. */
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
/** Upper bound keeps hashing cost bounded for very long inputs. */
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_LETTER = /\p{L}/u;
export const PASSWORD_NUMBER = /\d/;
/** Anything that is not a letter, digit or whitespace counts as a special character. */
export const PASSWORD_SPECIAL = /[^\p{L}\d\s]/u;

/** Brute-force protection for the sign-in and sign-up endpoints (per client IP). */
export const AUTH_RATE_LIMIT = { limit: 10, ttl: 60_000 };
