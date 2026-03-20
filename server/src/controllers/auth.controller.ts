import { User } from "../models/user.model";
import { Request, Response } from "express";
import { getCurrentUserService, sendOtpService, verifyOtpService } from "../services/auth.service";

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

        const { user, token } = await verifyOtpService(email, otp);

        res.cookie("token", token, {
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

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, message: "Logged out successfully" });    
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to log out" });
    }
}

export const currentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await getCurrentUserService(userId);

        res.status(200).json({ success: true, data: user, message: "Current user fetched successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch current user" });
    }
}