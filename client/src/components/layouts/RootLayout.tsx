import { Outlet } from "react-router-dom";

export const RootLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔥 Global wrapper only */}
      <Outlet />
    </div>
  );
};