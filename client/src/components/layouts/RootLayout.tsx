import { Outlet } from "react-router-dom"

export const RootLayout = () => {
    return (
        <div className="app-shell min-h-screen text-(--text-primary)">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(520px_320px_at_15%_20%,rgba(11,116,222,0.14),transparent),radial-gradient(680px_320px_at_85%_7%,rgba(0,168,143,0.12),transparent)]" />
            <Outlet />
        </div>
    )
}