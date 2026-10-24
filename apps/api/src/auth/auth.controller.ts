import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AUTH_RATE_LIMIT } from './auth.constants';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Post('signup')
  @Throttle({ default: AUTH_RATE_LIMIT })
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { user, accessToken } = await this.auth.signUp(dto);
    this.cookies.setAccessToken(res, accessToken);
    return { user };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: AUTH_RATE_LIMIT })
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { user, accessToken } = await this.auth.signIn(dto);
    this.cookies.setAccessToken(res, accessToken);
    return { user };
  }

  /**
   * Clears the session cookie. Tokens are stateless, so a copied token stays
   * valid until it expires; the short lifetime bounds that window.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    this.cookies.clearAccessToken(res);
  }
}
