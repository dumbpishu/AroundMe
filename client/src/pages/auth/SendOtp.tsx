import { Link } from "react-router-dom"
import { useState } from "react"
import { sendOtp } from "../../api/auth"
import { useNavigate } from "react-router-dom"

export const SendOtp = () => {
    const [email, setEmail] = useState("")
    const navigate = useNavigate()


    const handleSendOtp = async () => {
        try {
            const data = await sendOtp(email);
            if (data.success) {
                alert("OTP sent successfully! Please check your email.");
                navigate("/auth/verify-otp", { state: { email }});
            } else {
                alert("Failed to send OTP. Please try again.");
            }
        } catch (error) {
            console.error("Error sending OTP:", error);
            alert("Failed to send OTP. Please try again.");
        }
    }

    return (
        <div>
            <h1>Send OTP Page</h1>
            <input type="email" placeholder="example@gmail.com" required onChange={(e) => setEmail(e.target.value)} value={email}/>
            {/* Add your form and logic to send OTP here */}
            <button onClick={handleSendOtp}>Send OTP</button>
            <br />
            <Link to="/auth/verify-otp" className="text-blue-500 hover:underline">
                Go to Verify OTP
            </Link>
        </div>
    )
}