import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { EnvironmentVariables, NodeEnv } from '../config/env.validation';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';

/**
 * Owns the session cookie's flags. httpOnly keeps the token away from page
 * scripts (XSS); SameSite limits cross-site sending (CSRF); Secure is forced
 * in production and whenever SameSite=None.
 */
@Injectable()
export class AuthCookieService {
  private readonly options: CookieOptions;
  private readonly maxAgeMs: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const sameSite = config.get('COOKIE_SAMESITE', { infer: true });
    const isProduction = config.get('NODE_ENV', { infer: true }) === NodeEnv.Production;

    this.options = {
      httpOnly: true,
      secure: isProduction || sameSite === 'none',
      sameSite,
      path: '/',
    };
    this.maxAgeMs = config.get('JWT_EXPIRES_IN_SECONDS', { infer: true }) * 1000;
  }

  setAccessToken(res: Response, token: string): void {
    res.cookie(ACCESS_TOKEN_COOKIE, token, { ...this.options, maxAge: this.maxAgeMs });
  }

  clearAccessToken(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.options);
  }
}
