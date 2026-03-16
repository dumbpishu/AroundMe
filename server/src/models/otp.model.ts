import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            minlength: 5,
            maxlength: 255
        },
        otp: {
            type: String,
            required: true,
            trim: true,
            minlength: 6,
            maxlength: 6
        },
        expiresAt: {
            type: Date,
            required: true
        }
    },
    { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model("Otp", otpSchema);