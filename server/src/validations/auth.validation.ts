import { z } from "zod";

export const sendOtpSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email("Invalid email address").min(3, "Email must be at least 3 characters long").max(255, "Email must be at most 255 characters long")
    })
});

export const verifyOtpSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email("Invalid email address").min(3, "Email must be at least 3 characters long").max(255, "Email must be at most 255 characters long"),
        
        otp: z.string().trim().length(6, "OTP must be exactly 6 characters long")
    })
})