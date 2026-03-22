import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const formattedErrors = result.error.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new ApiError(400, "Invalid request data", formattedErrors);
        }

        req.body = result.data;
        next();
    } catch (error) {
        next(error);
    }
}