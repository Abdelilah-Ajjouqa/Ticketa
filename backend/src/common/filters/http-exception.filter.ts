import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    // NestJS HttpException (includes BadRequest, NotFound, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message =
          (resp.message as string | string[]) ||
          (resp.error as string) ||
          'Error';
      }
    }
    // Mongoose CastError (invalid ObjectId)
    else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ${exception.path}: ${exception.value}`;
    }
    // Mongoose ValidationError
    else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      const messages = Object.values(exception.errors).map(
        (err) => err.message,
      );
      message = messages.length === 1 ? messages[0] : messages;
    }
    // MongoDB duplicate key error (code 11000)
    else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as Record<string, unknown>).code === 11000
    ) {
      status = HttpStatus.CONFLICT;
      const keyValue = (exception as Record<string, unknown>).keyValue;
      message = `Duplicate value for: ${Object.keys(keyValue as object).join(', ')}`;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
