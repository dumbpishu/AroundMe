import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routes/appRoute";
import { useAuthStore } from "./store/auth.store";
import { useEffect } from "react";

export function App() {
    const refreshUser = useAuthStore((state) => state.refreshUser);

    // Refresh user on app load
    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <RouterProvider router={appRouter} />
    )
}