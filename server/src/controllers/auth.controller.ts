import { Request, Response } from "express";
import { getCurrentUserService, sendOtpService, verifyOtpService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await sendOtpService(email);

    return res.status(200).json(new ApiResponse(200, "OTP sent successfully"));
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const { user, token } = await verifyOtpService(email, otp);

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json(new ApiResponse(200, "OTP verified successfully", { user }));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 0,
    });

    return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

export const currentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await getCurrentUserService(userId);

    return res.status(200).json(new ApiResponse(200, "Current user retrieved successfully", { user }));
});