import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../lib/api-client';
import { applyServerErrors } from './server-errors';

type Values = { email: string; name: string; password: string };
const FIELDS = ['email', 'name', 'password'] as const;

describe('applyServerErrors', () => {
  it('attaches messages to the field they start with and returns the rest', () => {
    const setError = vi.fn();
    const error = new ApiError(400, [
      'Email must be a valid email address.',
      'Password must contain at least one number.',
      'Password must contain at least one special character.',
      'property role should not exist',
    ]);

    const unmatched = applyServerErrors<Values>(error, FIELDS, setError);

    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Email must be a valid email address.',
    });
    // Only the first message per field is shown inline.
    expect(setError).toHaveBeenCalledWith('password', {
      type: 'server',
      message: 'Password must contain at least one number.',
    });
    expect(setError).toHaveBeenCalledTimes(2);
    expect(unmatched).toEqual(['property role should not exist']);
  });

  it('returns messages that match no field for a form-level alert', () => {
    const setError = vi.fn();
    const unmatched = applyServerErrors<Values>(
      new ApiError(401, ['Invalid email or password.']),
      FIELDS,
      setError,
    );

    expect(setError).not.toHaveBeenCalled();
    expect(unmatched).toEqual(['Invalid email or password.']);
  });

  it('falls back to a generic message for unexpected errors', () => {
    expect(applyServerErrors<Values>(new Error('boom'), FIELDS, vi.fn())).toEqual([
      'Something went wrong. Please try again.',
    ]);
  });
});
