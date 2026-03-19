import express from "express";
import { sendOtp, verifyOtp, logout } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/logout", authMiddleware, logout);

export default router;