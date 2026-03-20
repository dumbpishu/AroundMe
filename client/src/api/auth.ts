import { api } from "../lib/axios";
import type { AuthUser, ApiResponse, LogoutResponse } from "../types/auth";

export const sendOtp = async (email: string) => {
    const res = await api.post<ApiResponse<Record<string, never>>>("/api/v1/auth/send-otp", { email });
    return res.data;
};

export const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post<ApiResponse<AuthUser>>("/api/v1/auth/verify-otp", { email, otp });
    return res.data;
};

export const logoutUser = async () => {
    const res = await api.post<LogoutResponse>("/api/v1/auth/logout");
    return res.data;
};

export const getCurrentUser = async () => {
    const res = await api.get<ApiResponse<AuthUser>>("/api/v1/auth/me");
    return res.data;
}