import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './api-client';

function mockFetch(response: Response | Error) {
  const fetchMock =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the session cookie and JSON body, and returns the parsed response', async () => {
    const fetchMock = mockFetch(json({ ok: true }));

    const result = await apiRequest<{ ok: boolean }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.co' }),
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/signin');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('exposes every validation message from the server', async () => {
    mockFetch(
      json(
        {
          statusCode: 400,
          error: 'Bad Request',
          message: ['Email must be a valid email address.', 'Name is too short.'],
          requestId: 'req-1',
        },
        400,
      ),
    );

    const error = await apiRequest('/auth/signup').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      messages: ['Email must be a valid email address.', 'Name is too short.'],
      requestId: 'req-1',
    });
  });

  it('wraps a single server message in an array', async () => {
    mockFetch(json({ statusCode: 401, error: 'Unauthorized', message: 'Nope.' }, 401));
    await expect(apiRequest('/users/me')).rejects.toMatchObject({
      status: 401,
      messages: ['Nope.'],
    });
  });

  it('falls back to a friendly message when the error body is not JSON', async () => {
    mockFetch(new Response('Too Many Requests', { status: 429 }));
    await expect(apiRequest('/auth/signin')).rejects.toMatchObject({
      status: 429,
      messages: ['Too many attempts. Please wait a minute and try again.'],
    });
  });

  it('reports network failures with status 0', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    await expect(apiRequest('/users/me')).rejects.toMatchObject({ status: 0 });
  });
});
