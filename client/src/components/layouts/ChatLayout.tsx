import { Outlet } from "react-router-dom";

export const ChatLayout = () => {
  return (
    <div className="h-screen flex">
      {/* sidebar  */}
      <div className="w-64 bg-gray-900 text-white hidden md:flex items-center justify-center">
        Sidebar
      </div>

      {/* main chat area */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};