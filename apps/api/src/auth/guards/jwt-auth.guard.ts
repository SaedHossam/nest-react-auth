import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth-user';

/**
 * Registered globally, so every route requires authentication unless it is
 * marked with `@Public()`. Accepts the token from the httpOnly cookie (browser)
 * or an `Authorization: Bearer` header (API clients, Swagger).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Your session is invalid or has expired.');
    }
  }

  private extractToken(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const fromCookie = cookies?.[ACCESS_TOKEN_COOKIE];
    if (fromCookie) return fromCookie;

    const [scheme, value] = req.headers.authorization?.split(' ') ?? [];
    return scheme === 'Bearer' && value ? value : undefined;
  }
}
