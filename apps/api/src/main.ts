import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { EnvironmentVariables } from './config/env.validation';
import { setupApp } from './setup-app';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  setupApp(app);

  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    setupSwagger(app);
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  app.get(Logger).log(`API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
