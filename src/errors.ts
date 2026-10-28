import type { ApiError } from './models.js';

/** Error thrown for Waktu Solat API, network and parsing failures. */
export class WaktuSolatApiException extends Error {
  /** The HTTP status code associated with the error, if available. */
  readonly statusCode: number | null;
  /** The detailed API error, if one was parsed from the response body. */
  readonly apiError: ApiError | null;

  constructor(message: string, statusCode: number | null = null, apiError: ApiError | null = null) {
    super(message);
    // Keep `instanceof` working when compiled to ES5.
    Object.setPrototypeOf(this, WaktuSolatApiException.prototype);
    this.name = 'WaktuSolatApiException';
    this.message = message;
    this.statusCode = statusCode;
    this.apiError = apiError;
  }

  toString(): string {
    return 'WaktuSolatApiException: ' + this.message +
      (this.statusCode !== null ? ' (Status Code: ' + this.statusCode + ')' : '');
  }
}

/** Thrown when a JSON payload does not match the expected model shape. */
export class FormatError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, FormatError.prototype);
    this.name = 'FormatError';
    this.message = message;
  }
}
