import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../api/api"; 
import { safeRequest } from "../utils/safeRequest";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // for controlling login modal
  const [modalOpen, setModalOpen] = useState(false);

  // Fetching current user 
  useEffect(() => {
    const fetchUser = async () => {
      const [res, err] = await safeRequest(() => api.get("/auth/me"));
      if (err) {
        setUser(null);
      } else {
        setUser(res.data?.data || null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      setUser(res.data.user || null);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Invalid email or password.";
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role) => {
    setError("");
    try {
      const res = await api.post("/auth/register", { name, email, password, role });
      setUser(res.data.user || null);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Signup failed. Please try again.";
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    await safeRequest(() => api.post("/auth/logout"));
    setUser(null);
    setError("");
  };

  const showLoginModal = () => setModalOpen(true);
  const closeLoginModal = () => setModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setUser,
        login,
        register,
        logout,
        setError,
        modalOpen,
        showLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
