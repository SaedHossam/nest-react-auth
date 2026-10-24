import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';
import type { AuthenticatedRequest } from '../types/auth-user';
import { JwtAuthGuard } from './jwt-auth.guard';

const SECRET = 'unit-test-secret-that-is-at-least-32-chars';
const PAYLOAD = { sub: '665f1c2e9b1e8a0012345678', email: 'jane@example.com' };

interface FakeRequest {
  cookies?: Record<string, string>;
  headers: { authorization?: string };
  user?: AuthenticatedRequest['user'];
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET });
  const reflector = new Reflector();
  const guard = new JwtAuthGuard(jwt, reflector);

  function contextFor(req: FakeRequest, isPublic = false): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  }

  it('lets public routes through without a token', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }, true))).resolves.toBe(true);
  });

  it('rejects requests without a token', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toThrow(
      new UnauthorizedException('Authentication required.'),
    );
  });

  it('accepts a valid token from the session cookie and attaches the user', async () => {
    const req: FakeRequest = {
      cookies: { [ACCESS_TOKEN_COOKIE]: jwt.sign(PAYLOAD) },
      headers: {},
    };

    await expect(guard.canActivate(contextFor(req))).resolves.toBe(true);
    expect(req.user).toEqual({ id: PAYLOAD.sub, email: PAYLOAD.email });
  });

  it('accepts a valid Bearer token', async () => {
    const req: FakeRequest = { headers: { authorization: `Bearer ${jwt.sign(PAYLOAD)}` } };
    await expect(guard.canActivate(contextFor(req))).resolves.toBe(true);
  });

  it.each([
    ['tampered', () => `${jwt.sign(PAYLOAD)}x`],
    ['expired', () => jwt.sign(PAYLOAD, { expiresIn: -10 })],
    ['signed with another secret', () => jwt.sign(PAYLOAD, { secret: 'x'.repeat(40) })],
  ])('rejects a %s token', async (_label, makeToken) => {
    const req: FakeRequest = { cookies: { [ACCESS_TOKEN_COOKIE]: makeToken() }, headers: {} };
    await expect(guard.canActivate(contextFor(req))).rejects.toThrow(
      new UnauthorizedException('Your session is invalid or has expired.'),
    );
  });

  it('ignores non-Bearer authorization schemes', async () => {
    const req: FakeRequest = { headers: { authorization: `Basic ${jwt.sign(PAYLOAD)}` } };
    await expect(guard.canActivate(contextFor(req))).rejects.toThrow(UnauthorizedException);
  });
});
