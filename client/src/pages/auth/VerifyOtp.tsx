import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";

export const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  if (!email) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>No email found. Please go back.</p>
      </div>
    );
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      await verifyOtp(email, otp);
      navigate("/chat");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form
        onSubmit={handleVerifyOtp}
        className="flex flex-col gap-4 w-80"
      >
        <h2 className="text-xl font-bold">Enter OTP</h2>

        <input
          type="text"
          placeholder="Enter OTP"
          className="border p-2 rounded"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white p-2 rounded"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
};