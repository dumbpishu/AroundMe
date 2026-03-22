import { Link } from "react-router-dom"

export const LandingPage = () => {
    return (
        <div>
            <h1 className="text-4xl font-bold text-center mt-20">Welcome to GeoChat</h1>
            <p className="text-center mt-4 text-gray-600">Connect with people around you in real-time!</p>
            <br />
            <Link to="/auth/send-otp">
                Sign in
            </Link>
        </div>
    )
}