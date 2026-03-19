import express from "express";
import { upload } from "../middlewares/multer";
import { uploadToCloudinary } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/media", authMiddleware, upload.array("file", 10), uploadToCloudinary);

export default router;