import { Link, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import UpdateProfileModal from "../components/updateProfileModal";

export default function Navbar() {
  const { user, logout, showLoginModal, closeLoginModal, modalOpen, setUser } = useAuth();
  const navigate = useNavigate();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!", {
      style: { color: "#FF0000" },
    });
    setTimeout(() => navigate("/"), 1000);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-black text-white shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            <Link
              to="/"
              className="invisible md:visible flex items-center justify-center space-x-2 text-lg font-semibold hover:text-blue-400 transition-colors duration-200 cursor-pointer"
            >
              <img
                src="/humanoid-robot_18220260.png"
                alt="Collab AI Logo"
                className="h-10 w-auto"
              />
              <span>CollabHub</span>
            </Link>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* User Initial Avatar */}
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium cursor-pointer"
                    onClick={() => setProfileModalOpen(true)}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <span
                    className="hidden md:inline text-gray-300 cursor-pointer"
                    onClick={() => setProfileModalOpen(true)}
                  >
                    {user.name}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200 cursor-pointer"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={showLoginModal}
                  className="cursor-pointer bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-all duration-200"
                >
                  Login / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={modalOpen} onClose={closeLoginModal} />

      {/* Update Profile Modal */}
      <UpdateProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
