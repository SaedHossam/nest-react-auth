import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '../../../components/FullPageSpinner';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { isApiError } from '../../../lib/api-client';
import { useCurrentUser } from '../hooks';
import { safeRedirectTarget, type RedirectState } from '../redirect';

// These guards are the single place that redirects on auth changes: signing in
// or out only updates the cached user, and the guard for the current route
// reacts. This avoids pages and guards racing to navigate.

/** Renders child routes only for signed-in users; otherwise sends them to sign in. */
export function RequireAuth() {
  const location = useLocation();
  const { data: user, isPending, error, refetch, isRefetching } = useCurrentUser();

  if (isPending) return <FullPageSpinner />;

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <Alert
          title="We couldn't check your session"
          messages={isApiError(error) ? error.messages : ['Please try again.']}
        />
        <Button onClick={() => void refetch()} loading={isRefetching}>
          Try again
        </Button>
      </main>
    );
  }

  if (!user) {
    const state: RedirectState = { from: location.pathname + location.search };
    return <Navigate to="/signin" replace state={state} />;
  }

  return <Outlet />;
}

/**
 * Keeps signed-in users away from the sign-in and sign-up pages, and sends
 * them on to the page they originally asked for once they sign in.
 */
export function GuestOnly() {
  const location = useLocation();
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return <FullPageSpinner />;
  if (user) return <Navigate to={safeRedirectTarget(location.state)} replace />;
  return <Outlet />;
}
