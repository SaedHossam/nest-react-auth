import { z } from 'zod';

/**
 * Field rules mirror the API's SignUpDto (apps/api/src/auth/auth.constants.ts).
 * The API stays the source of truth; these give instant feedback.
 */
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export interface PasswordRule {
  id: 'length' | 'letter' | 'number' | 'special';
  label: string;
  message: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'letter',
    label: 'At least one letter',
    message: 'Password must contain at least one letter.',
    test: (v) => /\p{L}/u.test(v),
  },
  {
    id: 'number',
    label: 'At least one number',
    message: 'Password must contain at least one number.',
    test: (v) => /\d/.test(v),
  },
  {
    id: 'special',
    label: 'At least one special character',
    message: 'Password must contain at least one special character.',
    // Anything that is not a letter, digit or whitespace.
    test: (v) => /[^\p{L}\d\s]/u.test(v),
  },
];

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .max(EMAIL_MAX_LENGTH, 'Email is too long.')
  .pipe(z.email('Enter a valid email address.'));

export const signUpSchema = z.object({
  email: emailField,
  name: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters long.`)
    .max(NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} characters long.`),
  password: z
    .string()
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`)
    .superRefine((value, ctx) => {
      for (const rule of PASSWORD_RULES) {
        if (!rule.test(value)) ctx.addIssue({ code: 'custom', message: rule.message });
      }
    }),
});

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
