import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const PublicOnlyRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-(--text-secondary)">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
};
