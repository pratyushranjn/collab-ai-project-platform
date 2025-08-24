import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, showLoginModal, loading } = useAuth();

  if (loading) return null;

  // If not logged in open Authmodal
  if (!user) {
    showLoginModal();
    return null;
  }

  // If roles are defined → check role
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
