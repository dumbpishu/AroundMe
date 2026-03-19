import express from "express";
import { upload } from "../middlewares/multer";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/upload", authMiddleware, upload.array("files", 10), uploadToCloudinary);

export default router;