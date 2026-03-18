import { Outlet } from "react-router-dom"
import { Link } from "react-router-dom"

export const RootLayout = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold"><Link to="/">Around Me</Link></h1>
            <div className="mt-4">
                {/* Render child routes here */}
                <Outlet />
            </div>
        </div>
    )
}