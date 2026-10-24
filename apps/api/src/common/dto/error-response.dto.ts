import { ApiProperty } from '@nestjs/swagger';

/** Shape of every error response, produced by AllExceptionsFilter. */
export class ErrorResponseDto {
  /** @example 400 */
  statusCode!: number;

  /** @example "Bad Request" */
  error!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['Password must contain at least one number.'],
    description: 'A message, or one message per failed validation rule.',
  })
  message!: string | string[];

  /** @example "/api/auth/signup" */
  path!: string;

  /** @example "2026-01-01T12:00:00.000Z" */
  timestamp!: string;

  /** Correlates the response with server logs; echoed in the `x-request-id` header. */
  requestId?: string;
}
