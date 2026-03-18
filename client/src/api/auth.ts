import { api } from "../services/axios";

export const sendOtp = async (email: string) => {
    const res =  await api.post("/auth/send-otp", { email });
    console.log("OTP send response:", res.data);
    return res.data;
}

export const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    console.log("OTP verification response:", res.data);
    return res.data;
}