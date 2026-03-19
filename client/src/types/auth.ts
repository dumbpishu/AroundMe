export type AuthUser = {
  _id: string;
  email: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};
