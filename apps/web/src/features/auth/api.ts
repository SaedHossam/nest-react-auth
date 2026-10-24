import { apiRequest } from '../../lib/api-client';
import type { SignInValues, SignUpValues } from './schemas';
import type { AuthResponse, User } from './types';

export const authApi = {
  signUp: (values: SignUpValues) =>
    apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(values) }),

  signIn: (values: SignInValues) =>
    apiRequest<AuthResponse>('/auth/signin', { method: 'POST', body: JSON.stringify(values) }),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),

  me: () => apiRequest<User>('/users/me'),
};
