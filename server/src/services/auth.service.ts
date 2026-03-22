import { Otp } from "../models/otp.model";
import { User } from "../models/user.model";
import { sendEmail } from "./email.service";
import { generateOtp, verifyOtp, otpEmailTemplate, generateAuthToken } from "../utils/auth";
import { ApiError } from "../utils/apiError";

const OTP_EXPIRY_IN_MS = 60 * 1000;

export const sendOtpService = async (email: string) => {
    const existingOtp = await Otp.findOne({ email });

    if (existingOtp && existingOtp.expiresAt > new Date()) {
        throw new ApiError(400, "OTP already sent. Please wait before requesting a new one.");
    }

    const { otp, hashedOtp } = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_IN_MS);

    await Otp.findOneAndUpdate(
        { email },
        { otp: hashedOtp, expiresAt },
        { upsert: true, new: true }
    );

    sendEmail(email, "Your OTP Code", otpEmailTemplate(otp)).catch((error) => {
        console.error("Error sending OTP email:", error);
        throw new ApiError(500, "Failed to send OTP email.");
    });
}

export const verifyOtpService = async (email: string, otp: string) => {
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
        throw new ApiError(400, "Please request a new OTP.");
    }

    const isValid = await verifyOtp(otp, otpRecord.otp);
    
    if (!isValid) {
        throw new Error("Invalid OTP.");
    }

    await Otp.deleteOne({ email });

    let user = await User.findOne({ email });

    if (!user) {
        const username = email.split("@")[0];
        user = new User({ email, username, isVerified: true });
        await user.save();
    }

    const token = generateAuthToken({ id: user._id.toString(), email: user.email });

    const userPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }

    return { user: userPayload, token };
}

export const getCurrentUserService = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
        throw new ApiError(404, "User not found.");
    }

    if (!user.isVerified) {
        throw new ApiError(403, "User is not verified.");
    }

    const payload = {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }

    return payload;
}