import { Otp } from "../models/otp.model";
import { User } from "../models/user.model";
import { sendEmail } from "./email.service";
import { generateOtp, verifyOtp, otpEmailTemplate, generateAuthToken } from "../utils/auth";

const OTP_EXPIRY_IN_MS = 60 * 1000;

export const sendOtpService = async (email: string) => {
    const existingOtp = await Otp.findOne({ email });

    if (existingOtp && existingOtp.expiresAt > new Date()) {
        throw new Error("An OTP has already been sent to this email. Please wait before requesting a new one.");
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
        throw new Error("Failed to send OTP email.");
    });
}

export const verifyOtpService = async (email: string, otp: string) => {
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
        throw new Error("OTP has expired or does not exist.");
    }

    const isValid = verifyOtp(otp, otpRecord.otp);
    
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
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }

    return { user: userPayload, token };
}