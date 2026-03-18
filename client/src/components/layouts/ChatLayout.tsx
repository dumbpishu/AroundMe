import { Outlet } from "react-router-dom";

export const ChatLayout = () => {
  return (
    <div className="flex h-screen w-screen">
        <div className="w-1/4 border-r">
            {/* Chat Inbox */}
            <Outlet />
        </div>
    </div>
  );
}