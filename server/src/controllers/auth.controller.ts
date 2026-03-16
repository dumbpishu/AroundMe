import { User } from "../models/user.model";
import { Request, Response } from "express";
import { sendOtpService, verifyOtpService } from "../services/auth.service";

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        await sendOtpService(email);

        res.status(200).json({ success: true, data: {}, message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
}

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        const { user, authToken } = await verifyOtpService(email, otp);

        res.cookie("authToken", authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ success: true, data: user, message: "OTP verified successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to verify OTP" });
    }
}