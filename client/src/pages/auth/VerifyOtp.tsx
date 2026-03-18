import { useState } from "react"
import { verifyOtp } from "../../api/auth"
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export const VerifyOtp = () => {
    const [otp, setOtp] = useState("");
    const location = useLocation();
    const email = location.state?.email || "";
    const navigate = useNavigate();

    const handleVerifyOtp = async () => {
        try {
            const data = await verifyOtp(email, otp);

            console.log("OTP verification result:", data);

            if (data.success) {
                alert("OTP verified successfully! You are now logged in.");
                // You can redirect the user to the dashboard or home page here
                navigate("/chat");
            } else {
                alert("Invalid OTP. Please try again.");
            }
        } catch (error) {
            alert("Failed to verify OTP. Please try again.");
        }
    }

    return (
        <div>
            <h1>Verify OTP Page</h1>
            {/* Add your form and logic to verify OTP here */}
            <input type="text" required placeholder="123456" onChange={(e) => setOtp(e.target.value)} value={otp}/>
            <button onClick={handleVerifyOtp}>Verify OTP</button>
        </div>
    )
}