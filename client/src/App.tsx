import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routes/appRoute";
import { useAuthStore } from "./store/auth.store";
import { useSocketStore } from "./store/socket.store";
import { useEffect } from "react";

export function App() {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    const refreshUser = useAuthStore((state) => state.refreshUser);

    const connect = useSocketStore((state) => state.connect);
    const disconnect = useSocketStore((state) => state.disconnect);

    // Refresh user on app load
    useEffect(() => {
        refreshUser();
    }, []);

    useEffect(() => {
        if (user) {
            connect();
        } else {
            disconnect();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <RouterProvider router={appRouter} />
    )
}