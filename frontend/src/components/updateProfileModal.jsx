import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function UpdateProfileModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/users/${user._id}`, formData);
      if (res.data.success) {
        toast.success("Profile updated!");
        setUser(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-7 rounded-2xl w-[95%] max-w-md shadow-2xl animate-slideUp">

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg md:text-xl font-semibold">Update Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-300 text-2xl hover:text-red-500 transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-400/30 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-400/30 outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
