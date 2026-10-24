import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsString, Max, Min, validateSync } from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Every environment variable the API reads. The app refuses to start if any
 * of them is missing or invalid, so misconfiguration fails fast at boot
 * instead of at the first request.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  MONGODB_URI!: string;

  /** Comma-separated list of origins allowed to call the API with credentials. */
  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN = 'http://localhost:5173';

  @IsIn(LOG_LEVELS)
  LOG_LEVEL: LogLevel = 'info';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validated;
}
