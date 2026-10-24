import { CircleAlert } from 'lucide-react';

/** Form-level error message. Renders nothing when there are no messages. */
export function Alert({ title, messages }: { title?: string; messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {messages.length === 1 ? (
          <p>{messages[0]}</p>
        ) : (
          <ul className="list-disc space-y-0.5 pl-4">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
