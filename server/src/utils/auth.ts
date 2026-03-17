import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email?: string;
}

export const generateOtp = (length: number = 6): { otp: string; hashedOtp: string } => {
    const otp = crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, "0");
    const hashedOtp = bcrypt.hashSync(otp, 10);
    return { otp, hashedOtp };
}

export const verifyOtp = async (otp: string, hashedOtp: string): Promise<boolean> => {
    return await bcrypt.compare(otp, hashedOtp);
}

export const generateAuthToken = (payload: JwtPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string => {
    const secretKey = process.env.AUTH_SECRET;

    if (!secretKey) {
        throw new Error("AUTH_SECRET environment variable is not defined.");
    }

    return jwt.sign(payload, secretKey, { expiresIn });
}

export const otpEmailTemplate = (otp: string) => {
  return `
  <div style="background-color:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
    
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;text-align:center;border:1px solid #e5e7eb;">
      
      <h2 style="margin-bottom:8px;color:#111827;">
        Verify Your Login
      </h2>

      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">
        Use the following One-Time Password (OTP) to continue.
      </p>

      <div style="font-size:32px;letter-spacing:6px;font-weight:bold;color:#111827;background:#f9fafb;border:1px dashed #d1d5db;padding:16px;border-radius:6px;margin-bottom:24px;">
        ${otp}
      </div>

      <p style="font-size:13px;color:#6b7280;margin:0;">
        This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <p style="font-size:12px;color:#9ca3af;margin-top:16px;">
        If you did not request this code, you can safely ignore this email.
      </p>

    </div>

  </div>
  `;
};