import { LogOut } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCurrentUser, useLogout } from '../features/auth/hooks';

export function AppPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  // Logging out clears the cached user; RequireAuth then redirects to sign in.
  const handleLogout = () => logout.mutate();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Logo className="size-8" />
            <span className="font-semibold">Nest React Auth</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline dark:text-slate-400">
              {user?.email}
            </span>
            <Button variant="secondary" onClick={handleLogout} loading={logout.isPending}>
              {!logout.isPending && <LogOut className="size-4" aria-hidden="true" />}
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <Card className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to the application.</h1>
          {user && (
            <p className="text-slate-600 dark:text-slate-400">
              You&apos;re signed in as <span className="font-medium">{user.name}</span>.
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}
