import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = loading, true = valid, false = invalid
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL;
        const res = await fetch(`${baseUrl}/auth/password/validate/${token}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setTokenValid(false);
          setTokenError(data.message || "This link is expired or invalid.");
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError("This link is expired or invalid.");
      }
    };
    validateToken();
  }, [token]);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const baseUrl = import.meta.env.VITE_BASE_URL;

      const res = await fetch(`${baseUrl}/auth/password/reset/${token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      toast.success("Password reset successful");

      // redirect after success
      setTimeout(() => {
        navigate("/projects");
      }, 1500);

    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "rgba(17,24,39,0.95)" }}>
        <div className="text-cyan-300 text-lg">Checking link...</div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "rgba(17,24,39,0.95)" }}>
        <div className="bg-gray-900 border border-cyan-700 rounded-xl shadow-lg w-full max-w-sm p-6 flex flex-col items-center" style={{ boxShadow: "0 0 30px rgba(6, 182, 212, 0.6)", fontFamily: "'Poppins', sans-serif" }}>
          <h2 className="text-xl font-bold text-center mb-5 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Reset Password</h2>
          <div className="text-red-400 text-center mb-4">{tokenError || "This link is expired or invalid."}</div>
          <button onClick={() => navigate("/")} className="mt-2 text-xs text-gray-400 hover:text-cyan-400 w-full">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "rgba(17,24,39,0.95)" }}
    >
      <div
        className="bg-gray-900 border border-cyan-700 rounded-xl shadow-lg w-full max-w-sm p-6"
        style={{
          boxShadow: "0 0 30px rgba(6, 182, 212, 0.6)",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-5 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Reset Password
        </h2>

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Confirm Password */}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 mb-4"
        />

        {/* Button */}
        <button
          onClick={handleReset}
          disabled={loading || !password || !confirmPassword}
          className={`w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all
            ${loading || !password || !confirmPassword
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            }`}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        {/* Back to login */}
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-xs text-gray-400 hover:text-cyan-400 w-full"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}