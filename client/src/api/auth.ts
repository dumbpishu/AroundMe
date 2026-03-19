import { api } from "../lib/axios";
import type { ApiResponse, AuthUser } from "../types/auth";

export const sendOtp = async (email: string) => {
    const res = await api.post<ApiResponse<Record<string, never>>>("/api/v1/auth/send-otp", { email });
    return res.data;
};

export const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post<ApiResponse<AuthUser>>("/api/v1/auth/verify-otp", { email, otp });
    return res.data;
};

type LogoutResponse = {
    success: boolean;
    message: string;
};

export const logoutUser = async () => {
    const res = await api.post<LogoutResponse>("/api/v1/auth/logout");
    return res.data;
};