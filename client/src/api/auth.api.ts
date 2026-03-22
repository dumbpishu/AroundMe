import { api } from "../lib/axios";

export const sendOtp = async (email: string) => {
    const res = await api.post("/api/v1/auth/send-otp", { email });
    return res.data;
}

export const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post("/api/v1/auth/verify-otp", { email, otp });
    return res.data;
}

export const getCurrentUser = async () => {
    const res = await api.get("/api/v1/auth/me");
    return res.data;
}

export const logout = async () => {
    const res = await api.post("/api/v1/auth/logout");
    return res.data;
}