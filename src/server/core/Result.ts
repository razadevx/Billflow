export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  constructor(public readonly value: T) {}

  isSuccess(): this is Success<T, E> {
    return true;
  }

  isFailure(): this is Failure<T, E> {
    return false;
  }
}

export class Failure<T, E> {
  constructor(public readonly error: E) {}

  isSuccess(): this is Success<T, E> {
    return false;
  }

  isFailure(): this is Failure<T, E> {
    return true;
  }
}

export const ok = <T, E = Error>(value: T): Result<T, E> => new Success(value);
export const fail = <T, E = Error>(error: E): Result<T, E> => new Failure(error);

export const success = <T, E = Error>(value: T): Result<T, E> => new Success(value);
export const failure = <T, E = Error>(error: E): Result<T, E> => new Failure(error);
