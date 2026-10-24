import { vi } from 'vitest';
import type { User } from '../features/auth/types';

interface Account extends User {
  password: string;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const error = (status: number, message: string | string[]) =>
  json({ statusCode: status, error: 'Error', message }, status);

/**
 * In-memory stand-in for the API, installed as `fetch`. It models the session
 * cookie with a "signed in as" pointer, which is enough to drive the real
 * router, guards and forms through complete flows.
 */
export function installFakeApi({
  signedInAs,
}: { signedInAs?: Omit<Account, 'id' | 'createdAt'> } = {}) {
  const accounts = new Map<string, Account>();
  let session: string | null = null;

  const addAccount = (data: Omit<Account, 'id' | 'createdAt'>) => {
    const account: Account = {
      ...data,
      id: String(accounts.size + 1),
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    accounts.set(account.email, account);
    return account;
  };
  const publicUser = ({ password: _password, ...user }: Account): User => user;

  if (signedInAs) session = addAccount(signedInAs).email;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const path = String(input);
    const method = init.method ?? 'GET';
    const body = init.body ? (JSON.parse(String(init.body)) as Record<string, string>) : {};

    if (method === 'GET' && path === '/api/users/me') {
      const account = session ? accounts.get(session) : undefined;
      return account ? json(publicUser(account), 200) : error(401, 'Authentication required.');
    }
    if (method === 'POST' && path === '/api/auth/signup') {
      if (accounts.has(body.email)) return error(409, 'An account with this email already exists.');
      const account = addAccount({ email: body.email, name: body.name, password: body.password });
      session = account.email;
      return json({ user: publicUser(account) }, 201);
    }
    if (method === 'POST' && path === '/api/auth/signin') {
      const account = accounts.get(body.email);
      if (!account || account.password !== body.password) {
        return error(401, 'Invalid email or password.');
      }
      session = account.email;
      return json({ user: publicUser(account) }, 200);
    }
    if (method === 'POST' && path === '/api/auth/logout') {
      session = null;
      return new Response(null, { status: 204 });
    }
    return error(404, `No fake route for ${method} ${path}`);
  });

  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, addAccount };
}
