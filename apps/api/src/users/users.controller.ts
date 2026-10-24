import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Protected: requires a valid access token (enforced by the global JwtAuthGuard). */
  @Get('me')
  async me(@CurrentUser() authUser: AuthUser): Promise<UserResponseDto> {
    const user = await this.users.findById(authUser.id);
    if (!user) {
      throw new UnauthorizedException('This account no longer exists.');
    }
    return UserResponseDto.fromDocument(user);
  }
}
