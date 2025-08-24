import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

function Tasks() {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadUserTasks = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await api.get("/tasks?mine=true");
      setTasks(response.data?.data || []);
      setError(null);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadUserTasks();
    }
  }, [currentUser]);

  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-500 text-white",
      medium: "bg-amber-500 text-white",
      low: "bg-emerald-500 text-white",
    };
    return colors[priority?.toLowerCase()] || "bg-slate-500 text-white";
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
      done: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return colors[status?.toLowerCase()] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const filteredTasks =
    filter === "all"
      ? tasks
      : tasks.filter(task => task.status?.toLowerCase() === filter);

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  const getCreatorName = (createdBy) =>
    typeof createdBy === "object" ? (createdBy?.name || "Unknown") : "Unknown";

  const renderAssignees = (assignedTo) => {
    const arr = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
      ? [assignedTo]
      : [];
    if (arr.length === 0) return "—";
    return arr.map(a => (typeof a === "object" ? (a?.name || "Unknown") : a)).join(", ");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-300">Loading your tasks...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => loadUserTasks()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-400">
            Hello, {currentUser?.name || "User"}! You have {tasks.length} tasks assigned.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {["all", "todo", "in-progress", "done"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? {
                      all: "bg-blue-600 text-white",
                      todo: "bg-yellow-600 text-white",
                      "in-progress": "bg-blue-600 text-white",
                      done: "bg-emerald-600 text-white",
                    }[status]
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-300">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
            <p>
              {filter === "all"
                ? "You don't have any tasks assigned yet."
                : `No tasks in "${filter}" status.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map(task => (
              <div
                key={task._id}
                className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-100 leading-tight">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority?.toUpperCase() || "LOW"}
                  </span>
                </div>

                {task.description && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-3">{task.description}</p>
                )}

                <div className="mb-3 text-sm text-slate-300">
                  <div>Project: {task.project?.name || "N/A"}</div>
                  <div>Due: {formatDate(task.dueDate)}</div>
                </div>

                <div className="mb-4 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">By:</span>{" "}
                  {getCreatorName(task.createdBy)}
                  {"  "}
                  <span className="mx-1">→</span>
                  <span className="font-semibold text-slate-300">To:</span>{" "}
                  {renderAssignees(task.assignedTo)}
                </div>

                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {task.status?.replace("-", " ").toUpperCase() || "TODO"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;
