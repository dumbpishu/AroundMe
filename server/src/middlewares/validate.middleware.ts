import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/apiError";

export const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        next();
    } catch (error: any) {
        const message = error.errors?.[0]?.message || "Validation error";

        next(new ApiError(400, message, error.errors));
    }
}