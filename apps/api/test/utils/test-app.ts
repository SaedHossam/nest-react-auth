import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mongoose';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { setupApp } from '../../src/setup-app';

/**
 * Boots the real AppModule (against the in-memory MongoDB from global-setup)
 * with the same HTTP setup as production, starting with no documents.
 */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  setupApp(app);
  await app.init();

  // Clear documents but keep collections: dropping the database would also drop
  // the unique email index the app built at startup.
  const connection = app.get<Connection>(getConnectionToken());
  await Promise.all(Object.values(connection.collections).map((c) => c.deleteMany({})));
  return app;
}
