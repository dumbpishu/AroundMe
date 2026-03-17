import { Link } from "react-router-dom"

export const LandingPage = () => {
    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <h1 className="text-4xl font-bold">Welcome to Around Me</h1>
            <Link to="/auth/send-otp" className="ml-4 text-blue-500 hover:underline">
                Sign In
            </Link>
        </div>
    )
}
