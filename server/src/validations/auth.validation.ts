import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters long")
    .refine(
      (email) => email.split("@")[0].length >= 3,
      {
        message: "Email must be at least 3 characters long before the @ symbol",
      }
    ),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters long")
    .refine(
      (email) => email.split("@")[0].length >= 3,
      {
        message: "Email must be at least 3 characters long before the @ symbol",
      }
    ),

  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 characters long"),
});