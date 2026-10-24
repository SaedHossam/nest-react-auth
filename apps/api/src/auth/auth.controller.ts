import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AUTH_RATE_LIMIT } from './auth.constants';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('auth')
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded.', type: ErrorResponseDto })
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Post('signup')
  @Throttle({ default: AUTH_RATE_LIMIT })
  @ApiOperation({ summary: 'Create an account and start a session (sets the session cookie)' })
  @ApiBadRequestResponse({ description: 'Validation failed.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Email already registered.', type: ErrorResponseDto })
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
  @ApiOperation({ summary: 'Sign in with email and password (sets the session cookie)' })
  @ApiBadRequestResponse({ description: 'Validation failed.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.', type: ErrorResponseDto })
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
  @ApiOperation({ summary: 'End the session (clears the session cookie)' })
  @ApiNoContentResponse({ description: 'Session cookie cleared.' })
  logout(@Res({ passthrough: true }) res: Response): void {
    this.cookies.clearAccessToken(res);
  }
}
