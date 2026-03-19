import { api } from "../lib/axios";

export type ChatAttachment = {
  url: string;
  public_id: string;
  type: "image" | "audio" | "video";
  size: number;
};

type UploadResponse = {
  success: boolean;
  data: ChatAttachment[];
  message: string;
};

export const uploadChatMedia = async (files: File[]) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("file", file);
  });

  const response = await api.post<UploadResponse>("/uploads/media", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
