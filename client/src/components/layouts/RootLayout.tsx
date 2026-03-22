import { Outlet } from "react-router-dom"

export const RootLayout = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100"> 
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Welcome to GeoChat</h2>
                <Outlet />
            </div>
        </div>
    )
}