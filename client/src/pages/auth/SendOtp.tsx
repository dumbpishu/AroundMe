import { Link } from "react-router-dom"
import { useState } from "react"
import { sendOtp } from "../../api/auth"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/Button"

export const SendOtp = () => {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const navigate = useNavigate()


    const handleSendOtp = async () => {
        if (!email.trim()) {
            setStatus({ type: "error", message: "Please enter your email address." })
            return
        }

        setLoading(true)
        setStatus(null)

        try {
            const data = await sendOtp(email);
            if (data.success) {
                setStatus({ type: "success", message: "OTP sent successfully. Check your inbox and continue." })
                navigate("/auth/verify-otp", { state: { email }});
            } else {
                setStatus({ type: "error", message: data.message || "Failed to send OTP. Please try again." })
            }
        } catch (error) {
            console.error("Error sending OTP:", error);
            setStatus({ type: "error", message: "Unable to send OTP right now. Please try again." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>Sign in to GeoChat</h1>
                <p className="mt-2 text-sm text-(--text-secondary)">
                    Enter your email to receive a one-time password.
                </p>
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-(--text-secondary)">Email address</label>
                <input
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    className="h-12 w-full rounded-xl border border-(--border) bg-white px-4 text-sm outline-none transition focus:border-(--brand) focus:ring-3 focus:ring-[#0b74de26]"
                />
            </div>

            {status && (
                <p className={`rounded-xl border px-4 py-3 text-sm ${status.type === "success" ? "border-[#8cd6c8] bg-[#e6f7f3] text-[#176657]" : "border-[#efc3c3] bg-[#fff3f3] text-[#8f2f2f]"}`}>
                    {status.message}
                </p>
            )}

            <Button onClick={handleSendOtp} block loading={loading}>Send OTP</Button>

            <p className="text-sm text-(--text-secondary)">
                Already got the code?{" "}
                <Link to="/auth/verify-otp" className="font-semibold text-(--brand) hover:text-(--brand-dark)">
                    Verify OTP
                </Link>
            </p>
        </div>
    )
}