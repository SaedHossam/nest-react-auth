import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_LETTER,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NUMBER,
  PASSWORD_SPECIAL,
} from '../auth.constants';
import { MatchesRule } from './matches-rule.decorator';
import { normalizeEmail, trimString } from './transforms';

export class SignUpDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(NAME_MIN_LENGTH, {
    message: `Name must be at least ${NAME_MIN_LENGTH} characters long.`,
  })
  @MaxLength(NAME_MAX_LENGTH, {
    message: `Name must be at most ${NAME_MAX_LENGTH} characters long.`,
  })
  name!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`,
  })
  @MatchesRule('passwordLetter', PASSWORD_LETTER, 'Password must contain at least one letter.')
  @MatchesRule('passwordNumber', PASSWORD_NUMBER, 'Password must contain at least one number.')
  @MatchesRule(
    'passwordSpecial',
    PASSWORD_SPECIAL,
    'Password must contain at least one special character.',
  )
  password!: string;
}
