import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, showLoginModal, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    // Open modal only after loading completes
    showLoginModal();
    return null;
  }

  return children;
}
