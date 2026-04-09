import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import DemoCredentialsCard from "./DemoCredentialsCard";
import '../App.css'


export default function AuthModal({ isOpen, onClose }) {
  const DEMO_ADMIN_EMAIL = "demo@aicollabhub.com";
  const DEMO_ADMIN_PASSWORD = "admin123";

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isVisible, setIsVisible] = useState(false); // for animation
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const modalRef = useRef();
  const demoDesktopRef = useRef();
  const demoMobileRef = useRef();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

  const handleClose = useCallback(() => {
    onClose();
    if (!user) navigate("/");
  }, [onClose, user, navigate]);

  // Animation mount/unmount
  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else {
      const timer = setTimeout(() => setIsVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedOutsideModal = modalRef.current && !modalRef.current.contains(e.target);
      const clickedOutsideDemoDesktop = demoDesktopRef.current && !demoDesktopRef.current.contains(e.target);
      const clickedOutsideDemoMobile = demoMobileRef.current && !demoMobileRef.current.contains(e.target);

      if (clickedOutsideModal && clickedOutsideDemoDesktop && clickedOutsideDemoMobile) {
        handleClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleClose]);

  // Reset form when tab changes
  useEffect(() => {
    setFormData({ name: "", email: "", password: "", role: "user" });
    setLocalError("");
  }, [isLogin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError("");
  };

  const useDemoCredentials = () => {
    setIsLogin(true);
    setShowForgot(false);
    setFormData((prev) => ({
      ...prev,
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
    }));
    setLocalError("");
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError("");

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
    }

    setLoading(false);

    if (!result.success) {
      setLocalError(result.message);
      return;
    }

    toast.success(isLogin ? "Logged in successfully!" : "Account created!");
    setFormData({ name: "", email: "", password: "", role: "user" });
    setShowPassword(false);
    setLocalError("");
    handleClose();
    navigate("/projects");
  };

  const handleGoogleSignIn = () => {
    setSocialLoading("google");
    const baseUrl = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    window.location.href = `${baseUrl}/auth/google`;
  };

  const handleGithubSignIn = () => {
    setSocialLoading("github");
    const baseUrl = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    window.location.href = `${baseUrl}/auth/github`;
  };


  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error("Please enter email");
      setForgotLoading(false);
      return;
    }

    try {
      setForgotLoading(true);

      const baseUrl = import.meta.env.VITE_BASE_URL;
      console.log("API URL:", `${baseUrl}/forgot-password`);

      if (!baseUrl) {
        toast.error("Server configuration error");
        setForgotLoading(false);
        return;
      }
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      toast.success(data.message || "Reset link sent");

      setShowForgot(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setForgotLoading(false);
    }
  };


  if (!isVisible) return null;


  return (
    <div
      className={`fixed inset-0 flex justify-center items-center z-50 p-4 backdrop-blur-sm ${isOpen ? "fadeIn" : "fadeOut"
        }`}
      style={{ background: "rgba(17,24,39,0.85)" }}
    >
      <div className="hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 z-[60]" ref={demoDesktopRef}>
        <DemoCredentialsCard
          email={DEMO_ADMIN_EMAIL}
          password={DEMO_ADMIN_PASSWORD}
          onCopyEmail={() => copyToClipboard(DEMO_ADMIN_EMAIL, "Email")}
          onCopyPassword={() => copyToClipboard(DEMO_ADMIN_PASSWORD, "Password")}
          onUseInLogin={useDemoCredentials}
        />
      </div>

      <div className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]" ref={demoMobileRef}>
        <DemoCredentialsCard
          email={DEMO_ADMIN_EMAIL}
          password={DEMO_ADMIN_PASSWORD}
          onCopyEmail={() => copyToClipboard(DEMO_ADMIN_EMAIL, "Email")}
          onCopyPassword={() => copyToClipboard(DEMO_ADMIN_PASSWORD, "Password")}
          onUseInLogin={useDemoCredentials}
        />
      </div>

      <div
        ref={modalRef}
        className={`bg-gray-900 border border-cyan-700 rounded-xl shadow-lg w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 relative transform ${isOpen ? "modalEnter" : "modalExit"
          }`}
        style={{ boxShadow: "0 0 30px rgba(6, 182, 212, 0.6)", fontFamily: "'Poppins', sans-serif" }}
      >
        <button
          className="absolute top-3 right-3 text-cyan-400 hover:text-red-500 transition-colors"
          onClick={handleClose}
        >
          ✕
        </button>

        {/* Header */}
        {!showForgot && (
          <div className="mb-4">
            <div className="flex relative border-b border-gray-700">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-center font-medium transition-colors ${isLogin ? "text-cyan-400" : "text-gray-400 hover:text-white"
                  }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-center font-medium transition-colors ${!isLogin ? "text-cyan-400" : "text-gray-400 hover:text-white"
                  }`}
              >
                Signup
              </button>
              <div
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: "50%", left: isLogin ? "0%" : "50%" }}
              />
            </div>

            <h2 className="mt-4 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 text-center">
              {isLogin ? "Login to Account" : "Create Account"}
            </h2>
          </div>
        )}

        {/* Main Content */}
        {showForgot ? (

          <div className="space-y-4">
            <h2 className="text-center text-lg font-semibold text-cyan-400">
              Reset Password
            </h2>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
            />

            <button
              onClick={handleForgotPassword}
              disabled={forgotLoading || !forgotEmail}
              className={`w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all
                  ${forgotLoading || !forgotEmail
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                }`}
            >
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              onClick={() => setShowForgot(false)}
              className="text-xs text-gray-400 hover:text-cyan-400 w-full flex items-center justify-center gap-1 transition"
            >
              <span>←</span>
              <span>Back to Login</span>
            </button>
          </div>

        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cyan-300 mb-1">FULL NAME</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cyan-300 mb-1">ROLE</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="user">User</option>
                    <option value="project-manager">Project Manager</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-cyan-300 mb-1">EMAIL</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-cyan-300 mb-1">PASSWORD</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white focus:outline-none transform translate-y-2.5"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {localError && (
              <p className="text-red-500 text-xs font-medium mt-1">{localError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-2.5 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? (isLogin ? "SIGNING IN..." : "CREATING...") : (isLogin ? "SIGN IN" : "CREATE ACCOUNT")}
            </button>

            {/* OR Divider */}
            <div className="relative py-1">
              <div className="border-t border-gray-700" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-2 text-[11px] text-gray-400">OR</span>
            </div>

            {/* Social Buttons */}
            <div className="space-y-2">
              <button type="button" onClick={handleGoogleSignIn} disabled={loading || !!socialLoading} className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg border text-white bg-gradient-to-r from-gray-900 to-gray-800 transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(6,182,212,0.22)] ${socialLoading === "google" ? "border-cyan-400 animate-pulse cursor-wait" : "border-cyan-700/70 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.38)]"} ${loading || !!socialLoading ? "opacity-70 cursor-not-allowed" : ""}`}>
                {socialLoading === "google" && <span className="w-4 h-4 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />}
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2087 1.125-.8427 2.0782-1.796 2.7164v2.2582h2.9087c1.7018-1.5668 2.6837-3.8741 2.6837-6.6155z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1791l-2.9087-2.2582c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5823-5.0364-3.7091H.9573v2.3327C2.4382 15.9832 5.4818 18 9 18z" />
                  <path fill="#FBBC05" d="M3.9636 10.7127C3.7836 10.1727 3.6818 9.5959 3.6818 9s.1018-1.1727.2818-1.7127V4.9545H.9573C.3477 6.1677 0 7.5409 0 9s.3477 2.8323.9573 4.0455l3.0063-2.3328z" />
                  <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3459l2.5814-2.5813C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9545l3.0063 2.3328C4.6718 5.1618 6.6559 3.5795 9 3.5795z" />
                </svg>
                <span>{socialLoading === "google" ? "REDIRECTING..." : "Continue with Google"}</span>
              </button>

              <button type="button" onClick={handleGithubSignIn} disabled={loading || !!socialLoading} className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg border text-white bg-gradient-to-r from-gray-900 to-gray-800 transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(6,182,212,0.22)] ${socialLoading === "github" ? "border-cyan-400 animate-pulse cursor-wait" : "border-cyan-700/70 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.38)]"} ${loading || !!socialLoading ? "opacity-70 cursor-not-allowed" : ""}`}>
                {socialLoading === "github" && <span className="w-4 h-4 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />}
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="currentColor" d="M9 0C4.03 0 0 4.03 0 9c0 3.98 2.58 7.35 6.16 8.54.45.08.62-.19.62-.43 0-.21-.01-.92-.01-1.67-2.26.41-2.84-.55-3.02-1.05-.1-.26-.51-1.05-.87-1.26-.3-.16-.72-.57-.01-.58.67-.01 1.15.62 1.31.87.76 1.28 1.98.92 2.46.7.08-.55.3-.92.55-1.13-2-.23-4.09-1-4.09-4.45 0-.98.35-1.79.92-2.42-.09-.23-.4-1.15.09-2.4 0 0 .75-.24 2.48.92.72-.2 1.49-.3 2.25-.3.76 0 1.53.1 2.25.3 1.73-1.17 2.48-.92 2.48-.92.49 1.25.18 2.17.09 2.4.57.63.92 1.43.92 2.42 0 3.46-2.1 4.22-4.1 4.45.31.27.58.8.58 1.62 0 1.17-.01 2.11-.01 2.39 0 .24.17.52.62.43A9.01 9.01 0 0 0 18 9c0-4.97-4.03-9-9-9z" />
                </svg>
                <span>{socialLoading === "github" ? "REDIRECTING..." : "Continue with GitHub"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}