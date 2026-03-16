import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
    origin: (origin: string | undefined, callback: (arg0: Error | null, arg1: boolean | undefined) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"), false);
        }
    },
    credentials: true
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

import authRoutes from "./routes/auth.route";

app.use("/api/v1/auth", authRoutes);

export default app;