import { ArgumentsHost, BadRequestException, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  function run(exception: unknown) {
    const json = jest.fn<void, [Record<string, unknown>]>();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ id: 'req-1', method: 'GET', originalUrl: '/api/test' }),
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);
    return { status, body: json.mock.calls[0][0] };
  }

  it('keeps the status and message of HTTP exceptions', () => {
    const { status, body } = run(new NotFoundException('User not found.'));

    expect(status).toHaveBeenCalledWith(404);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'User not found.',
      path: '/api/test',
      requestId: 'req-1',
    });
  });

  it('passes validation message arrays through', () => {
    const { body } = run(new BadRequestException(['a is required', 'b is required']));
    expect(body.message).toEqual(['a is required', 'b is required']);
  });

  it('hides the details of unexpected errors behind a generic 500', () => {
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);

    const { status, body } = run(new Error('connection string mongodb://secret@host'));

    expect(status).toHaveBeenCalledWith(500);
    expect(body.message).toBe('Something went wrong. Please try again later.');
    expect(JSON.stringify(body)).not.toContain('secret');
  });
});
