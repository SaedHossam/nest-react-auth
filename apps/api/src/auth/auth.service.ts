import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserResponseDto } from '../users/dto/user-response.dto';
import type { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import type { SignInDto } from './dto/sign-in.dto';
import type { SignUpDto } from './dto/sign-up.dto';
import type { JwtPayload } from './types/auth-user';

export interface AuthResult {
  user: UserResponseDto;
  accessToken: string;
}

const INVALID_CREDENTIALS = 'Invalid email or password.';

@Injectable()
export class AuthService {
  /**
   * Verified against when the email is unknown, so a failed sign in takes
   * the same time whether or not the account exists (no user enumeration
   * via response timing).
   */
  private readonly dummyHash = argon2.hash('timing-equalizer-not-a-real-password');

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResult> {
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });
    return this.issueSession(user);
  }

  async signIn(dto: SignInDto): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const passwordMatches = await argon2.verify(hash, dto.password);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return this.issueSession(user);
  }

  private async issueSession(user: UserDocument): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      user: UserResponseDto.fromDocument(user),
      accessToken: await this.jwt.signAsync(payload),
    };
  }
}
