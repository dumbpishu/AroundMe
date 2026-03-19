import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-(--text-secondary)">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/send-otp" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
