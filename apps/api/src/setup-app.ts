import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { EnvironmentVariables } from './config/env.validation';

export const API_PREFIX = 'api';

/**
 * HTTP-level setup shared by `main.ts` and the e2e tests, so tests exercise
 * the same middleware stack as production.
 */
export function setupApp(app: INestApplication): void {
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config
      .get('CORS_ORIGIN', { infer: true })
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.enableShutdownHooks();
}
