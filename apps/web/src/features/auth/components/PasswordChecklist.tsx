import { Check, X } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { PASSWORD_RULES } from '../schemas';

/** Live view of which password requirements are met. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid gap-1 pt-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        const Icon = met ? Check : X;
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400',
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {rule.label}
              <span className="sr-only">{met ? ' (met)' : ' (not met)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
