import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isApiError } from '../../lib/api-client';

const FALLBACK = 'Something went wrong. Please try again.';

/**
 * Attaches API error messages to the matching form fields. The API phrases
 * field errors as "<Field> must …" (e.g. "Password must contain a number."),
 * so a message is matched to a field by its leading word. Anything that
 * doesn't match a field is returned for a form-level alert.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): string[] {
  if (!isApiError(error)) return [FALLBACK];

  const unmatched: string[] = [];
  const assigned = new Set<Path<T>>();

  for (const message of error.messages) {
    const field = fields.find((f) => message.toLowerCase().startsWith(f.toLowerCase()));
    if (field && !assigned.has(field)) {
      setError(field, { type: 'server', message });
      assigned.add(field);
    } else if (!field) {
      unmatched.push(message);
    }
  }
  return unmatched;
}
