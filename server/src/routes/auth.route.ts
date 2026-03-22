import express from "express";
import { sendOtp, verifyOtp, logout, currentUser } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate.middleware";
import { sendOtpSchema, verifyOtpSchema } from "../validations/auth.validation";

const router = express.Router();

router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, currentUser);

export default router;