import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error Handler:", err);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: process.env.NODE_ENV === "development" ? err.error : undefined
        });
    }

    if (err.name === "ValidationError") {
        const messages = Object.values((err as any).errors).map((val: any) => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join(", "),
            error: process.env.NODE_ENV === "development" ? err : undefined
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : undefined
    });
}