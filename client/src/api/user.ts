import { api } from "../lib/axios";
import type { AuthUser, ApiResponse } from "../types/auth";

export const updateUserProfile = async (payload: { username?: string; name?: string }) => {
  const response = await api.put<ApiResponse<AuthUser>>("/api/v1/users/me", payload);
  return response.data;
};

export const updateUserAvatar = async (avatar: File) => {
  const formData = new FormData();
  formData.append("avatar", avatar);

  const response = await api.put<ApiResponse<AuthUser>>("/api/v1/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteMyAccount = async () => {
  const response = await api.delete<ApiResponse<Record<string, never>>>("/api/v1/users/me");
  return response.data;
};
