export enum HttpCode {
  Ok = 200,
  Redirect = 302,
  NotFound = 404,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  LargePayload = 413,
  ServerError = 500,
}

/**
 * Represents an error with a message and an HTTP status code. This code will be
 * used in the HTTP response.
 */
export class HttpError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: HttpCode,
    public readonly details?: object,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export const CookieKeys = {
  Session: `code-server-session${process.env?.CODE_SERVER_COOKIE_SUFFIX ? "-" + process.env?.CODE_SERVER_COOKIE_SUFFIX : ""}`,
}
