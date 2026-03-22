export class ApiError extends Error {
    success: boolean;
    statusCode: number;
    message: string;
    error?: any;

    constructor(statusCode: number, message: string, error?: any) {
        super(message);
        this.success = false;
        this.statusCode = statusCode;
        this.message = message;
        if (error !== undefined) {
            this.error = error;
        }

        Error.captureStackTrace(this, this.constructor);
    }
}