import { describe, expect, it } from 'vitest';
import { PASSWORD_RULES, signInSchema, signUpSchema } from './schemas';

const VALID = { email: 'jane@example.com', name: 'Jane', password: 'Passw0rd!' };

function issuesFor(input: Record<string, unknown>) {
  const result = signUpSchema.safeParse(input);
  if (result.success) return {};
  const byField: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    (byField[field] ??= []).push(issue.message);
  }
  return byField;
}

describe('signUpSchema', () => {
  it('accepts valid input and trims email and name', () => {
    const result = signUpSchema.parse({ ...VALID, email: '  jane@example.com ', name: '  Jane ' });
    expect(result).toEqual(VALID);
  });

  it.each(['', 'plainaddress', 'jane@', '@example.com'])('rejects email %p', (email) => {
    expect(issuesFor({ ...VALID, email }).email).toHaveLength(1);
  });

  it('requires at least 3 characters for the name after trimming', () => {
    expect(issuesFor({ ...VALID, name: '  ab ' }).name).toEqual([
      'Name must be at least 3 characters long.',
    ]);
    expect(issuesFor({ ...VALID, name: 'Ann' })).toEqual({});
  });

  it.each([
    ['Pa0!', 'Password must be at least 8 characters long.'],
    ['12345678!', 'Password must contain at least one letter.'],
    ['Password!', 'Password must contain at least one number.'],
    ['Passw0rdd', 'Password must contain at least one special character.'],
  ])('rejects password %p', (password, message) => {
    expect(issuesFor({ ...VALID, password }).password).toEqual([message]);
  });

  it('reports every unmet password rule at once (same as the API)', () => {
    expect(issuesFor({ ...VALID, password: 'short' }).password).toEqual([
      'Password must be at least 8 characters long.',
      'Password must contain at least one number.',
      'Password must contain at least one special character.',
    ]);
  });

  it('does not count whitespace as a special character', () => {
    expect(issuesFor({ ...VALID, password: 'Passw0rd here' }).password).toEqual([
      'Password must contain at least one special character.',
    ]);
  });

  it('accepts non-ASCII letters, like the API', () => {
    expect(issuesFor({ ...VALID, password: 'Pässwörd1!' })).toEqual({});
  });
});

describe('signInSchema', () => {
  it('only requires a password to be present (no strength rules)', () => {
    expect(signInSchema.safeParse({ email: 'jane@example.com', password: 'x' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'jane@example.com', password: '' }).success).toBe(false);
  });
});

describe('PASSWORD_RULES', () => {
  it('drives the checklist with one rule per requirement', () => {
    expect(PASSWORD_RULES.map((r) => r.id)).toEqual(['length', 'letter', 'number', 'special']);
  });
});
