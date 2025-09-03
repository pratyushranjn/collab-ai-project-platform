import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function ProtectedRoute({ children, roles }) {
  const { user, showLoginModal, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      showLoginModal();
    }
  }, [loading, user, showLoginModal]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
        <p className="text-sm">Checking authentication…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
