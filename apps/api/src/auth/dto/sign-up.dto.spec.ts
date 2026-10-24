import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

const VALID = { email: 'jane@example.com', name: 'Jane', password: 'Passw0rd!' };

const MESSAGES = {
  length: 'Password must be at least 8 characters long.',
  letter: 'Password must contain at least one letter.',
  number: 'Password must contain at least one number.',
  special: 'Password must contain at least one special character.',
};

async function validateSignUp(input: Record<string, unknown>) {
  const dto = plainToInstance(SignUpDto, input);
  const errors = await validate(dto);
  const byField = Object.fromEntries(
    errors.map((e) => [e.property, Object.values(e.constraints ?? {})]),
  ) as Record<string, string[]>;
  return { dto, byField };
}

describe('SignUpDto', () => {
  it('accepts valid input', async () => {
    const { byField } = await validateSignUp(VALID);
    expect(byField).toEqual({});
  });

  it('trims and lowercases the email', async () => {
    const { dto, byField } = await validateSignUp({ ...VALID, email: '  Jane@Example.COM ' });
    expect(byField).toEqual({});
    expect(dto.email).toBe('jane@example.com');
  });

  it.each(['plainaddress', 'missing@tld', '@example.com', 'jane@'])(
    'rejects invalid email %p',
    async (email) => {
      const { byField } = await validateSignUp({ ...VALID, email });
      expect(byField.email).toContain('Email must be a valid email address.');
    },
  );

  it('trims the name before checking its length', async () => {
    const { byField } = await validateSignUp({ ...VALID, name: '  ab  ' });
    expect(byField.name).toEqual(['Name must be at least 3 characters long.']);
  });

  it('accepts a 3-character name', async () => {
    const { byField } = await validateSignUp({ ...VALID, name: 'Ann' });
    expect(byField).toEqual({});
  });

  it.each([
    ['Pa0!', [MESSAGES.length]],
    ['12345678!', [MESSAGES.letter]],
    ['Password!', [MESSAGES.number]],
    ['Passw0rdd', [MESSAGES.special]],
  ])('rejects password %p with the matching rule', async (password, expected) => {
    const { byField } = await validateSignUp({ ...VALID, password });
    expect(byField.password).toEqual(expect.arrayContaining(expected));
    expect(byField.password).toHaveLength(expected.length);
  });

  it('reports every unmet password rule at once', async () => {
    const { byField } = await validateSignUp({ ...VALID, password: 'short' });
    expect(byField.password).toEqual(
      expect.arrayContaining([MESSAGES.length, MESSAGES.number, MESSAGES.special]),
    );
  });

  it('does not count whitespace as a special character', async () => {
    const { byField } = await validateSignUp({ ...VALID, password: 'Passw0rd here' });
    expect(byField.password).toEqual([MESSAGES.special]);
  });

  it('rejects passwords longer than 128 characters', async () => {
    const { byField } = await validateSignUp({ ...VALID, password: `Aa1!${'x'.repeat(125)}` });
    expect(byField.password).toEqual(['Password must be at most 128 characters long.']);
  });
});
