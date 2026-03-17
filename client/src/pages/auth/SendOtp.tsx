import { Link } from "react-router-dom"

export const SendOtp = () => {
    return (
        <div>
            <h1>Send OTP Page</h1>
            {/* Add your form and logic to send OTP here */}
            <Link to="/auth/verify-otp" className="text-blue-500 hover:underline">
                Go to Verify OTP
            </Link>
        </div>
    )
}