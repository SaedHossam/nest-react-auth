import { UserResponseDto } from '../../users/dto/user-response.dto';

/** The access token travels in an httpOnly cookie, so it is not part of the body. */
export class AuthResponseDto {
  user!: UserResponseDto;
}
