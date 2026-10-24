/** Error body returned by the API for every failed request. */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  /** One entry per failed validation rule, or a single message. */
  readonly messages: string[];
  readonly requestId?: string;

  constructor(status: number, messages: string[], requestId?: string) {
    super(messages[0] ?? 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
    this.requestId = requestId;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

/**
 * Thin `fetch` wrapper: always sends the session cookie, speaks JSON, and
 * turns non-2xx responses into `ApiError` with the server's messages.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, [NETWORK_ERROR]);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw toApiError(response.status, body);
  }
  return body as T;
}

function toApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message, requestId } = body as ApiErrorBody;
    const messages = Array.isArray(message) ? message : [message];
    return new ApiError(status, messages, requestId);
  }
  if (status === 429) {
    return new ApiError(status, ['Too many attempts. Please wait a minute and try again.']);
  }
  return new ApiError(status, ['Something went wrong. Please try again.']);
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
