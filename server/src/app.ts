import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const allowedOrigins = ["http://localhost:5173", "https://geochat.pishu.in", "https://geo-chat-tau.vercel.app"];

const corsOptions = {
    origin: (origin: string | undefined, callback: (arg0: Error | null, arg1: boolean | undefined) => void) => {
        if (!origin) return callback(null, true); 
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("CORS policy: No access from the specified origin"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import uploadRoutes from "./routes/upload.route";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/uploads", uploadRoutes);

import { Request, Response, NextFunction } from "express";

// global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error Handler:", err);

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

export default app;