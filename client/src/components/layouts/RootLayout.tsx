import { Outlet } from "react-router-dom"

export const RootLayout = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">Around Me</h1>
            <div className="mt-4">
                {/* Render child routes here */}
                <Outlet />
            </div>
        </div>
    )
}