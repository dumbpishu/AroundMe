import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { configureSocket } from "./config/socket";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        
        const server = createServer(app);

        const io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_BASE_URL || "http://localhost:5173",
                credentials: true,
            },
        });
        configureSocket(io);

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();