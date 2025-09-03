import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { LogOut, Bell, Plus, User } from "lucide-react";
import toast from "react-hot-toast";

import AuthModal from "./AuthModal";
import UpdateProfileModal from "./UpdateProfileModal";
import QuickCreateModal from "./QuickCreateModal";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";

export default function Navbar() {
  const { user, logout, showLoginModal, closeLoginModal, modalOpen } = useAuth();
  const { items: notifications, unread, markAllRead } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Refs for outside click detection
  const quickCreateRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Open one menu and close others
  const toggleMenu = (menu) => {
    setShowQuickCreate(menu === "quick" ? (prev) => !prev : false);
    setShowNotifications(menu === "notif" ? (prev) => !prev : false);
    setShowUserMenu(menu === "user" ? (prev) => !prev : false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target))
        setShowQuickCreate(false);
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      )
        setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setShowQuickCreate(false);
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowQuickCreateModal(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("notifications"); // extra safety
    logout();
    toast.success("Logged out successfully!");
    setTimeout(() => navigate("/"), 1000);
  };

  // Callback when modal creates something
  const handleCreated = ({ type, project }) => {
    if (type === "project" && project?._id) {
      navigate(`/projects/${project._id}`);
    }
  };

  const defaultProjectId = "";

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-black text-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 justify-end md:justify-between">
            {/* Logo */}
            <Link to="/" className="hidden md:flex items-center space-x-2">
              <img
                src="/humanoid-robot_18220260.png"
                alt="Logo"
                className="h-9"
              />
              <span className="text-lg font-semibold">CollabHub</span>
            </Link>

            <div className="flex items-center space-x-3 sm:space-x-4">
              {user ? (
                <>
                  <Link
                    to="/ai"
                    className="hidden md:block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 transition text-sm font-medium"
                  >
                    ✨ Ask AI
                  </Link>

                  {/* Quick Create */}
                  <div className="relative" ref={quickCreateRef}>
                    <button
                      aria-haspopup="menu"
                      aria-expanded={showQuickCreate}
                      className="p-2 rounded-full bg-green-600 hover:bg-green-700 transition cursor-pointer"
                      onClick={() => toggleMenu("quick")}
                    >
                      <Plus size={20} />
                    </button>
                    {showQuickCreate && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-44 bg-black text-white rounded-lg border border-gray-800 shadow-lg p-2 z-50"
                      >
                        <button
                          className="block w-full text-left px-3 py-2 hover:bg-gray-800 rounded cursor-pointer"
                          onClick={() => {
                            setShowQuickCreate(false);
                            setShowQuickCreateModal(true);
                          }}
                        >
                          New Task
                        </button>
                        <button
                          className="block w-full text-left px-3 py-2 hover:bg-gray-800 rounded"
                          onClick={() => {
                            setShowQuickCreate(false);
                            setShowQuickCreateModal(true);
                          }}
                        >
                          New Project
                        </button>
                        <button className="block w-full text-left px-3 py-2 rounded opacity-60 cursor-not-allowed">
                          New Document
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="relative" ref={notificationsRef}>
                    <button
                      aria-haspopup="menu"
                      aria-expanded={showNotifications}
                      className="relative p-2 rounded-full hover:bg-gray-800 transition"
                      onClick={() => {
                        toggleMenu("notif");
                        if (!showNotifications) markAllRead(); // clears localStorage + state
                      }}
                    >
                      <Bell size={20} />
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 text-xs flex items-center justify-center bg-red-500 rounded-full">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-auto bg-black text-white rounded-lg border border-gray-800 shadow-lg p-3 z-50"
                      >
                        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                          <p className="text-sm text-gray-400">🔔 Notifications</p>
                          <span className="text-xs text-gray-500">All cleared</span>
                        </div>

                        <div className="mt-2 space-y-2">
                          {notifications.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                              <Bell className="w-6 h-6 mb-1 opacity-50" />
                              <p className="text-sm">No notifications</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      aria-haspopup="menu"
                      aria-expanded={showUserMenu}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold cursor-pointer"
                      onClick={() => toggleMenu("user")}
                    >
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </button>
                    {showUserMenu && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-48 bg-black text-white rounded-lg border border-gray-800 shadow-lg py-2 z-50"
                      >
                        <button
                          onClick={() => setProfileModalOpen(true)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-800 cursor-pointer"
                        >
                          <User size={16} /> Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-800 text-red-400 cursor-pointer"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={showLoginModal}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-sm sm:text-base cursor-pointer"
                >
                  Login / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal isOpen={modalOpen} onClose={closeLoginModal} />
      <UpdateProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <QuickCreateModal
        isOpen={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        defaultProjectId={defaultProjectId}
        onCreated={handleCreated}
      />
    </>
  );
}
