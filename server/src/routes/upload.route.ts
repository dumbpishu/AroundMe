import express from "express";
import { upload } from "../middlewares/upload";
import { uploadToCloudinary } from "../services/upload.cloudinary";
import { authMiddleware } from "./authMiddleware";

const router = express.Router();

router.post("/upload", authMiddleware, upload.array("files", 10), uploadToCloudinary);

export default router;