import { Outlet } from "react-router-dom"

export const AuthLayout = () => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md p-8 bg-white rounded shadow">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
                {/* Render child routes here */}
                <Outlet />
            </div>
        </div>
    )
}