export type ActionErrorCode =
  'invalid-input' | 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict' | 'unknown';

/** A typed, user-safe error. Server actions map these to an ActionResult; raw errors never leak. */
export class AppError extends Error {
  readonly code: ActionErrorCode;
  constructor(code: ActionErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Please sign in.') {
    super('unauthenticated', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to do that.') {
    super('forbidden', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found.') {
    super('not-found', message);
  }
}

/** The result every server action returns — the UI renders it; never a thrown Prisma error. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionErrorCode; message: string; issues?: Record<string, string[]> };
