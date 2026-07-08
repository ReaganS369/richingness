/**
 * Base Application Error class for Richingness Platform.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

export class AuthError extends AppError {
  constructor(message: string, code = 'UNAUTHENTICATED') {
    super(message, code, 401);
  }
}

export class SyncError extends AppError {
  constructor(message: string, code = 'SYNC_ERROR') {
    super(message, code, 400);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, code = 'DATABASE_ERROR') {
    super(message, code, 500);
  }
}
