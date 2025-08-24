import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Menu, X } from "lucide-react";
import toast from "react-hot-toast";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleProtectedNav = (path) => {
    if (user) {
      navigate(path);
      setIsOpen(false);
    } else {
      toast.error("Please login first!");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out!");
    setIsOpen(false);
    navigate("/");
  };

  const links = [
    { path: "/projects", label: "Projects" },
    { path: "/task", label: "Task" },
    { path: "/ai", label: "AI Ideas" },
    { path: "/mindmap", label: "Mind Map" },
    { path: "/board", label: "Kanban Board" },
    { path: "/chat", label: "Chat" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  if (user?.role === "admin") {
    links.push({ path: "/admin", label: "Admin Panel", admin: true });
  }

  return (

    <aside id="sidebar">
      {/* Sidebar toggle button (mobile) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[9999] p-2 rounded bg-gray-900 text-white hover:bg-gray-800 md:hidden cursor-pointer"
      >
        {isOpen ? <X size={22} color="white" /> : <Menu size={22} color="white" />}
      </button>

      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-black text-white w-64 border-t border-gray-700 transform transition-transform duration-300 z-40 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <nav className="mt-6 space-y-2 px-4">
          {links.map((item) => (
            <button
              key={item.path}
              onClick={() => handleProtectedNav(item.path)}
              className={`block w-full text-left px-3 py-2 rounded transition-colors duration-200 cursor-pointer
                ${isActive(item.path)
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"}
                ${item.admin ? "hover:text-red-400" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* <div className="absolute bottom-6 left-0 w-full px-4">
          {user ? (
            <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm ">{user.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-500 cursor-pointer"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Not logged in</p>
          )}
        </div>
         */}

      </div>
    </aside>
  );
}
