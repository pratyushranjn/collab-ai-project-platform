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
    if (currentUser) loadUserTasks();
  }, [currentUser]);

  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-600/20 text-red-400",
      medium: "bg-yellow-600/20 text-yellow-400",
      low: "bg-green-600/20 text-green-400",
    };
    return colors[priority?.toLowerCase()] || "bg-gray-600/20 text-gray-400";
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: "bg-yellow-600/20 text-yellow-400",
      "in-progress": "bg-blue-600/20 text-blue-400",
      done: "bg-green-600/20 text-green-400",
    };
    return colors[status?.toLowerCase()] || "bg-gray-600/20 text-gray-400";
  };

  const filteredTasks =
    filter === "all"
      ? tasks
      : tasks.filter((task) => task.status?.toLowerCase() === filter);

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCreatorName = (createdBy) =>
    typeof createdBy === "object" ? createdBy?.name || "Unknown" : "Unknown";

  const renderAssignees = (assignedTo) => {
    const arr = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
      ? [assignedTo]
      : [];
    if (arr.length === 0) return "—";
    return arr
      .map((a) => (typeof a === "object" ? a?.name || "Unknown" : a))
      .join(", ");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
          Loading your tasks...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={loadUserTasks}
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          Hello, {currentUser?.name || "User"}
        </h1>
        <p className="text-gray-400 text-sm">
          You have {tasks.length} tasks assigned
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "todo", "in-progress", "done"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-md text-sm transition ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-[#020617] border border-gray-700 text-gray-300 hover:border-gray-500"
            }`}
          >
            {status === "in-progress"
              ? "In Progress"
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <h3 className="text-lg font-medium mb-1">No tasks found</h3>
          <p className="text-sm">
            {filter === "all"
              ? "You don’t have any tasks yet"
              : `No "${filter}" tasks`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition"
            >
              {/* Title + priority */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{task.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority || "low"}
                </span>
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Meta */}
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                <div>Project: {task.project?.name || "N/A"}</div>
                <div>Due: {formatDate(task.dueDate)}</div>
              </div>

              {/* People */}
              <div className="text-xs text-gray-400 mb-3">
                {getCreatorName(task.createdBy)} → {renderAssignees(task.assignedTo)}
              </div>

              {/* Status */}
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                {task.status || "todo"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Tasks;