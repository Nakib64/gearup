export class AppError extends Error {
  public statusCode: number;
  public errorDetails: any;

  constructor(statusCode: number, message: string, errorDetails: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    
    // Maintain proper stack trace (only available on V8 engines like Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
