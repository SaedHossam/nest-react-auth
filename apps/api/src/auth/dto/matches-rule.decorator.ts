import { ValidateBy, type ValidationOptions } from 'class-validator';

/**
 * Like `@Matches`, but with its own constraint name. Stacked `@Matches`
 * decorators share the "matches" key, so only one failure message survives;
 * naming each rule reports every unmet password requirement at once.
 */
export function MatchesRule(
  name: string,
  pattern: RegExp,
  message: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name,
      validator: {
        validate: (value: unknown) => typeof value === 'string' && pattern.test(value),
        defaultMessage: () => message,
      },
    },
    options,
  );
}
