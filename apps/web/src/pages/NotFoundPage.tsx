import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <Link
        to="/"
        className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Go to the application
      </Link>
    </main>
  );
}
