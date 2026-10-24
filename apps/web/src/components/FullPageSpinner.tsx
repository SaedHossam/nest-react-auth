import { Spinner } from './ui/Spinner';

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status">
      <Spinner className="size-8 text-indigo-600" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
