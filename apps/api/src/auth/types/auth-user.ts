import type { Request } from 'express';

/** Claims stored in the access token. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** The authenticated principal attached to the request by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
