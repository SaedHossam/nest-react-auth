import type { ReactNode } from 'react';
import { Card } from '../../../components/ui/Card';
import { Logo } from '../../../components/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-linear-to-b from-indigo-50 to-slate-50 px-4 py-12 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="size-11" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <Card>{children}</Card>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">{footer}</p>
      </div>
    </main>
  );
}
