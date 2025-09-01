import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  // If logged in → redirect to dashboard
  // if (user) {
  //   return <Navigate to="/projects" replace />;
  // }

  return children;
}
