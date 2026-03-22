import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";

export const SendOtp = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = useAuthStore((s) => s.sendOtp);
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter email");
      return;
    }

    try {
      setLoading(true);

      await sendOtp(email);
      toast.success("OTP sent successfully 🚀");
      navigate("/auth/verify-otp", { state: { email } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form
        onSubmit={handleSendOtp}
        className="flex flex-col gap-4 w-80"
      >
        <h2 className="text-xl font-bold">Enter your email</h2>

        <input
          type="email"
          placeholder="Enter email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
};