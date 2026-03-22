import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "./utils/apiError";

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
// app.options("*", cors(corsOptions));

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import uploadRoutes from "./routes/upload.route";
import { errorHandler } from "./middlewares/error.middleware";
import { getLocationFromIP } from "./controllers/location.controller";
import { authMiddleware } from "./middlewares/authMiddleware";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.get("/api/v1/location", authMiddleware, getLocationFromIP);

app.use((req: Request, res: Response, next: NextFunction) => {
    next(new ApiError(404, "Route not found"));
});

app.use(errorHandler);

export default app;