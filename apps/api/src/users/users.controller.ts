import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid session.', type: ErrorResponseDto })
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Protected: requires a valid access token (enforced by the global JwtAuthGuard). */
  @Get('me')
  @ApiOperation({ summary: 'Get the signed-in user' })
  async me(@CurrentUser() authUser: AuthUser): Promise<UserResponseDto> {
    const user = await this.users.findById(authUser.id);
    if (!user) {
      throw new UnauthorizedException('This account no longer exists.');
    }
    return UserResponseDto.fromDocument(user);
  }
}
