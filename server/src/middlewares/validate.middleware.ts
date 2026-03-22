import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            throw new ApiError(400, "Invalid request data", result.error);
        }

        req.body = result.data;
        next();
    } catch (error) {
        next(error);
    }
}