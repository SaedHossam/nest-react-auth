import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH } from '../auth.constants';
import { normalizeEmail } from './transforms';

/** Only shape checks here: password strength rules apply at sign up, not sign in. */
export class SignInDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
