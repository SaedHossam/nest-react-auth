import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from './auth/auth.constants';

/** Served under the global prefix: `/api/docs` (UI) and `/api/docs/json` (OpenAPI spec). */
export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('nest-react-auth API')
    .setDescription(
      'Sign up, sign in and session endpoints. Signing in from this page sets the ' +
        `\`${ACCESS_TOKEN_COOKIE}\` cookie, so protected endpoints work right after.`,
    )
    .setVersion('1.0')
    .addCookieAuth(ACCESS_TOKEN_COOKIE)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: `${SWAGGER_PATH}/json`,
  });
}
