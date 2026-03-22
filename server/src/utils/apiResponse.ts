export class ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;

    constructor(statusCode: number, message: string, data?: T) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        if (data !== undefined) {
            this.data = data;
        }
    }
}