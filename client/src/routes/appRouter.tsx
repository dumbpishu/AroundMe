import { createBrowserRouter } from "react-router-dom";
// layouts
import { RootLayout } from "../components/layouts/RootLayout";
import { AuthLayout } from "../components/layouts/AuthLayout";
// pages
import { LandingPage } from "../pages/LandingPage";
import { SendOtp } from "../pages/auth/SendOtp";
import { VerifyOtp } from "../pages/auth/VerifyOtp";

export const appRouter = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <LandingPage />
            },
            {
                path: "auth",
                element: <AuthLayout />,
                children: [
                    {
                        path: "send-otp",
                        element: <SendOtp />
                    },
                    {
                        path: "verify-otp",
                        element: <VerifyOtp />
                    }
                ]
            }
        ]
    }
])