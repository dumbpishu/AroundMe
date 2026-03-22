import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../components/layouts/RootLayout";
import { AuthLayout } from "../components/layouts/AuthLayout";
import { ChatLayout } from "../components/layouts/ChatLayout";

import { LandingPage } from "../pages/LandingPage";
import { SendOtp } from "../pages/auth/SendOtp";
import { VerifyOtp } from "../pages/auth/VerifyOtp";
import { Chat } from "../pages/chat/Chat";

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
            },
            {
                path: "chat",
                element: <ChatLayout />,
                children: [
                    {
                        index: true,
                        element: <Chat />
                    }
                ]
            }
        ]
    }
])