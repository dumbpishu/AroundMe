export class ApiError extends Error {
    success: boolean;
    statusCode: number
    error?: any;

    constructor(statusCode: number, message: string, error?: any) {
        super(message);
        this.success = false;
        this.statusCode = statusCode;
        
        if (error) {
            this.error = error;
        }

        Error.captureStackTrace(this, this.constructor);
    }
}