import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import { EnvironmentVariables, NodeEnv } from './env.validation';

export const REQUEST_ID_HEADER = 'x-request-id';

export function loggerConfig(config: ConfigService<EnvironmentVariables, true>): Params {
  const env = config.get('NODE_ENV', { infer: true });

  return {
    pinoHttp: {
      level: config.get('LOG_LEVEL', { infer: true }),
      // Reuse an upstream request id (e.g. from a proxy) or mint one, and echo it back.
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const incoming = req.headers[REQUEST_ID_HEADER];
        const id = typeof incoming === 'string' && incoming ? incoming : randomUUID();
        res.setHeader(REQUEST_ID_HEADER, id);
        return id;
      },
      // Never write credentials or session cookies to the logs.
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        censor: '[REDACTED]',
      },
      autoLogging: { ignore: (req) => req.url?.endsWith('/health') ?? false },
      transport:
        env === NodeEnv.Development
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
      enabled: env !== NodeEnv.Test,
    },
  };
}
