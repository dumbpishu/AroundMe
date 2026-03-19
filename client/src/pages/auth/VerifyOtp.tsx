import { useState } from "react"
import { verifyOtp } from "../../api/auth"
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const VerifyOtp = () => {
    const { login } = useAuth();
    const [otp, setOtp] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const location = useLocation();
    const email = location.state?.email || emailInput;
    const navigate = useNavigate();

    const handleVerifyOtp = async () => {
        if (!email) {
            setStatus({ type: "error", message: "Email missing. Please return to send OTP again." });
            return;
        }

        if (!otp.trim()) {
            setStatus({ type: "error", message: "Please enter the OTP code." });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const data = await verifyOtp(email, otp);

            if (data.success) {
                login(data.data);
                setStatus({ type: "success", message: "OTP verified. Redirecting to chat..." });
                navigate("/chat", { replace: true });
            } else {
                setStatus({ type: "error", message: data.message || "Invalid OTP. Please try again." });
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            setStatus({ type: "error", message: "Unable to verify OTP right now. Please try again." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>Verify your OTP</h1>
                <p className="mt-2 text-sm text-(--text-secondary)">{email ? `We sent a one-time code to ${email}.` : "Enter your email and OTP code to continue."}</p>
            </div>

            {!location.state?.email && (
                <div className="space-y-2">
                    <label htmlFor="verify-email" className="text-sm font-semibold text-(--text-secondary)">Email</label>
                    <input
                        id="verify-email"
                        type="email"
                        required
                        placeholder="example@gmail.com"
                        onChange={(e) => setEmailInput(e.target.value)}
                        value={emailInput}
                        className="h-12 w-full rounded-xl border border-(--border) bg-white px-4 text-sm outline-none transition focus:border-(--brand) focus:ring-3 focus:ring-[#0b74de26]"
                    />
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-semibold text-(--text-secondary)">OTP Code</label>
                <input
                    id="otp"
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    onChange={(e) => setOtp(e.target.value)}
                    value={otp}
                    className="h-12 w-full rounded-xl border border-(--border) bg-white px-4 text-sm tracking-[0.18em] outline-none transition focus:border-(--brand) focus:ring-3 focus:ring-[#0b74de26]"
                />
            </div>

            {status && (
                <p className={`rounded-xl border px-4 py-3 text-sm ${status.type === "success" ? "border-[#8cd6c8] bg-[#e6f7f3] text-[#176657]" : "border-[#efc3c3] bg-[#fff3f3] text-[#8f2f2f]"}`}>
                    {status.message}
                </p>
            )}

            <Button onClick={handleVerifyOtp} block loading={loading}>Verify and enter chat</Button>

            <p className="text-sm text-(--text-secondary)">
                Want to use another email?{" "}
                <Link to="/auth/send-otp" className="font-semibold text-(--brand) hover:text-(--brand-dark)">
                    Send OTP again
                </Link>
            </p>
        </div>
    )
}