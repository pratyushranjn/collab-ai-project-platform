import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function TaskUpdateModal({ isOpen, onClose, task, onUpdated }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isPM = user?.role === "project-manager";

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "low",
    status: "todo",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        assignedTo: task.assignedTo?._id || "",
        priority: task.priority || "low",
        status: task.status || "todo",
      });
    }
  }, [task]);

  useEffect(() => {
    if (isAdmin || isPM) {
      api
        .get("/users")
        .then((res) => setUsers(res.data?.data || []))
        .catch((err) => console.error("Failed to load users:", err));
    }
  }, [isAdmin, isPM]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/tasks/${task._id}`, formData);
      toast.success("Task updated successfully!");
      onUpdated?.(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full sm:max-w-lg bg-black text-white border border-gray-800 rounded-xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">✏️ Edit Task</h3>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Task title"
            className="w-full px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows={3}
          />

          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            style={{ backgroundColor: "#000000" }}
            className="w-full px-3 py-2 rounded border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select Developer</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={{ backgroundColor: "#000000" }}
              className="flex-1 px-3 py-2 rounded border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ backgroundColor: "#000000" }}
              className="flex-1 px-3 py-2 rounded border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
