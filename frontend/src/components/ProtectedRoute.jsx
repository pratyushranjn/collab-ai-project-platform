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
    return <div className="text-center py-10">Checking authentication…</div>;
  }

  if (!user) {
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
