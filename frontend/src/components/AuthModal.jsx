import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import '../App.css'

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isVisible, setIsVisible] = useState(false); // for animation

  const modalRef = useRef();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

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
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset form when tab changes
  useEffect(() => {
    setFormData({ name: "", email: "", password: "", role: "user" });
    setLocalError("");
  }, [isLogin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError("");
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

  const handleClose = () => {
    onClose();
    if (!user) navigate("/");
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex justify-center items-center z-50 p-4 backdrop-blur-sm ${isOpen ? "fadeIn" : "fadeOut"
        }`}
      style={{ background: "rgba(17,24,39,0.85)" }}
    >
      <div
        ref={modalRef}
        className={`bg-gray-900 border border-cyan-700 rounded-xl shadow-lg w-full max-w-sm p-6 relative overflow-hidden transform ${isOpen ? "modalEnter" : "modalExit"
          }`}
        style={{
          boxShadow: "0 0 30px rgba(6, 182, 212, 0.6)",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <button
          className="absolute top-3 right-3 text-cyan-400 hover:text-red-500 transition-colors"
          onClick={handleClose}
        >
          ✕
        </button>

        <div className="mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-medium text-cyan-300 mb-1">
                  FULL NAME
                </label>
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
                <label className="block text-xs font-medium text-cyan-300 mb-1">
                  ROLE
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full text-sm bg-gray-800 border border-cyan-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="user">User</option>
                  <option value="project-manager">Project Manager</option>

                  {/* Later we can remove direct admin resgistration from here */}
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-cyan-300 mb-1">
              EMAIL
            </label>
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
            <label className="block text-xs font-medium text-cyan-300 mb-1">
              PASSWORD
            </label>
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

          {localError && (
            <p className="text-red-500 text-xs font-medium mt-1">{localError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 py-2.5 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading
              ? isLogin
                ? "SIGNING IN..."
                : "CREATING..."
              : isLogin
                ? "SIGN IN"
                : "CREATE ACCOUNT"}
          </button>
        </form>
      </div>
    </div>
  );
}
