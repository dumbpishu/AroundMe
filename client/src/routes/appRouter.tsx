import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
// layouts
import { RootLayout } from "../components/layouts/RootLayout";
import { AuthLayout } from "../components/layouts/AuthLayout";
import { ChatLayout } from "../components/layouts/ChatLayout";
import { PublicOnlyRoute } from "../components/guards/PublicOnlyRoute";
import { ProtectedRoute } from "../components/guards/ProtectedRoute";
// pages
import { LandingPage } from "../pages/LandingPage";
import { SendOtp } from "../pages/auth/SendOtp";
import { VerifyOtp } from "../pages/auth/VerifyOtp";
import { Chat } from "../pages/chat/Chat";
import { ErrorPage } from "../pages/ErrorPage";
import { AccountSettings } from "../pages/account/AccountSettings";

export const appRouter = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <LandingPage />
            },
            {
                element: <PublicOnlyRoute />,
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
                    },
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
                    },
                    {
                        path: "profile",
                        element: <ChatLayout />,
                        children: [
                            {
                                index: true,
                                element: <AccountSettings />
                            }
                        ]
                    },
                    {
                        path: "account",
                        element: <Navigate to="/profile" replace />
                    }
                ]
            },
            {
                path: "*",
                element: <ErrorPage />
            }
        ]
    }
])