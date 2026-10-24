import { hashKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '../../lib/api-client';
import { authApi } from './api';
import type { AuthResponse, User } from './types';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * The signed-in user, or `null` when signed out. The session lives in an
 * httpOnly cookie the app can't read, so the server is asked who we are.
 */
export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (isApiError(error) && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
}

function useStoreSession() {
  const queryClient = useQueryClient();
  return ({ user }: AuthResponse) => queryClient.setQueryData(authKeys.me, user);
}

export function useSignUp() {
  const storeSession = useStoreSession();
  return useMutation({ mutationFn: authApi.signUp, onSuccess: storeSession });
}

export function useSignIn() {
  const storeSession = useStoreSession();
  return useMutation({ mutationFn: authApi.signIn, onSuccess: storeSession });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    // Runs even if the request failed, so nothing from the previous session
    // lingers. The user is set to null in place (not removed with clear()) so
    // that RequireAuth, which observes this query, is notified and redirects.
    onSettled: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryHash !== hashKey(authKeys.me),
      });
    },
  });
}
