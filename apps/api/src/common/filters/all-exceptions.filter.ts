import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Turns every thrown error into one consistent JSON shape. Unexpected errors
 * are logged with their stack and returned as a generic 500 so internals
 * never leak to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();

    const { statusCode, error, message } = this.describe(exception);

    if (statusCode >= 500) {
      this.logger.error(
        { err: exception, requestId: req.id },
        `Unhandled error on ${req.method} ${req.originalUrl}`,
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      error,
      message,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    };

    res.status(statusCode).json(body);
  }

  private describe(
    exception: unknown,
  ): Pick<ErrorResponseBody, 'statusCode' | 'error' | 'message'> {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { statusCode, error: exception.name, message: response };
      }

      const { error, message } = response as { error?: string; message?: string | string[] };
      return {
        statusCode,
        error: error ?? exception.name,
        message: message ?? exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Something went wrong. Please try again later.',
    };
  }
}
