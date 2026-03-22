import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../components/layouts/RootLayout";
import { AuthLayout } from "../components/layouts/AuthLayout";
import { ChatLayout } from "../components/layouts/ChatLayout";

import { LandingPage } from "../pages/LandingPage";
import { SendOtp } from "../pages/auth/SendOtp";
import { VerifyOtp } from "../pages/auth/VerifyOtp";
import { Chat } from "../pages/chat/Chat";

import { PublicRoute } from "../components/gaurds/PublicRoute";
import { ProtectedRoute } from "../components/gaurds/ProtectedRoute";

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
                element: <PublicRoute />,
                children: [
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
            },
            {
                element: <ProtectedRoute />,
                children: [
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
        ]
    }
])