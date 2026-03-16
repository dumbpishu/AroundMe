import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoURI = process.env.DATABASE_URL;

        if (!mongoURI) {
            throw new Error("DATABASE_URL is not defined in environment variables");
        }

        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}