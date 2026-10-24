import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './utils/test-app';

interface UserBody {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
interface ErrorBody {
  statusCode: number;
  message: string | string[];
}

const PASSWORD = 'Passw0rd!';

function sessionCookie(res: request.Response): string | undefined {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith('access_token='));
}

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/health reports the database as up', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', info: { mongodb: { status: 'up' } } });
  });

  describe('POST /api/auth/signup', () => {
    it('creates the account, normalizes input and sets an httpOnly session cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: '  Jane@Example.com ', name: '  Jane Doe ', password: PASSWORD })
        .expect(201);

      const { user } = res.body as { user: UserBody };
      expect(user).toEqual({
        id: expect.any(String) as unknown,
        email: 'jane@example.com',
        name: 'Jane Doe',
        createdAt: expect.any(String) as unknown,
      });
      expect(res.body).not.toHaveProperty('user.passwordHash');

      const cookie = sessionCookie(res);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
    });

    it('rejects a duplicate email regardless of case', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'JANE@example.com', name: 'Another Jane', password: PASSWORD })
        .expect(409);

      expect((res.body as ErrorBody).message).toBe('An account with this email already exists.');
    });

    it('returns every validation error in one response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'not-an-email', name: 'ab', password: 'short' })
        .expect(400);

      expect((res.body as ErrorBody).message).toEqual(
        expect.arrayContaining([
          'Email must be a valid email address.',
          'Name must be at least 3 characters long.',
          'Password must be at least 8 characters long.',
          'Password must contain at least one number.',
          'Password must contain at least one special character.',
        ]),
      );
    });

    it('rejects unknown fields (no mass assignment)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'mallory@example.com', name: 'Mallory', password: PASSWORD, role: 'admin' })
        .expect(400);

      expect((res.body as ErrorBody).message).toContain('property role should not exist');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('signs in with valid credentials (email is case-insensitive)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signin')
        .send({ email: 'JANE@EXAMPLE.COM', password: PASSWORD })
        .expect(200);

      expect((res.body as { user: UserBody }).user.email).toBe('jane@example.com');
      expect(sessionCookie(res)).toBeDefined();
    });

    it.each([
      ['a wrong password', { email: 'jane@example.com', password: 'Wr0ng-pass!' }],
      ['an unknown email', { email: 'nobody@example.com', password: PASSWORD }],
    ])('returns the same 401 for %s', async (_label, body) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signin')
        .send(body)
        .expect(401);

      expect((res.body as ErrorBody).message).toBe('Invalid email or password.');
      expect(sessionCookie(res)).toBeUndefined();
    });
  });

  describe('protected GET /api/users/me', () => {
    it('rejects anonymous requests', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });

    it('returns the user for a cookie session, and logout ends it', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/auth/signin')
        .send({ email: 'jane@example.com', password: PASSWORD })
        .expect(200);

      const me = await agent.get('/api/users/me').expect(200);
      expect((me.body as UserBody).email).toBe('jane@example.com');

      const logout = await agent.post('/api/auth/logout').expect(204);
      expect(sessionCookie(logout)).toMatch(/Expires=Thu, 01 Jan 1970/);

      await agent.get('/api/users/me').expect(401);
    });

    it('accepts the token as a Bearer header', async () => {
      const signin = await request(app.getHttpServer())
        .post('/api/auth/signin')
        .send({ email: 'jane@example.com', password: PASSWORD })
        .expect(200);
      const token = sessionCookie(signin)?.split(';')[0].split('=')[1];

      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});

describe('Auth rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('blocks sign-in attempts after 10 per minute', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/signin')
        .send({ email: 'jane@example.com', password: 'guess' });

    for (let i = 0; i < 10; i++) {
      await attempt().expect(401);
    }
    await attempt().expect(429);
  });
});
