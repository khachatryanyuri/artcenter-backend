import { ValidationError } from 'express-validator';

import { ICustomError } from '../interfaces/errorInterface';

export class CustomError extends Error implements ICustomError {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string | ValidationError[], statusCode = 400) {
    super(JSON.stringify(message), statusCode);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class InvalidCredentials extends CustomError {
  constructor(message: string) {
    super(message, 401);
  }
}
