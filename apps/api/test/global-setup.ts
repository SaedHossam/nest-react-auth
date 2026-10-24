import { MongoMemoryServer } from 'mongodb-memory-server';

export const TEST_JWT_SECRET = 'e2e-test-secret-that-is-at-least-32-chars';

/**
 * Starts one in-memory MongoDB for the whole e2e run and points the app at it.
 * This runs before any test module is loaded, which matters because
 * ConfigModule reads and validates the environment at import time.
 */
export default async function globalSetup(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  (globalThis as { __MONGO__?: MongoMemoryServer }).__MONGO__ = mongo;

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri('nest-react-auth-e2e');
  process.env.JWT_SECRET = TEST_JWT_SECRET;
}
