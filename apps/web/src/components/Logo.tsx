import { LockKeyhole } from 'lucide-react';
import { cn } from '../lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm',
        className,
      )}
    >
      <LockKeyhole className="size-1/2" aria-hidden="true" />
    </span>
  );
}
