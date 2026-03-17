import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email: string };
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            throw new Error("Authentication Error.");
        }

        const decoded = jwt.verify(token, process.env.AUTH_SECRET as string);

        req.user = decoded as { id: string; email: string };

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
}