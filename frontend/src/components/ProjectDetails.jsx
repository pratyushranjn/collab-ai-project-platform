import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useParams, Link, useNavigate } from "react-router-dom";
import TaskUpdateModal from "./TaskModal";
import { useAuth } from "../context/AuthContext";

export default function ProjectDetails() {
  const params = useParams();
  const projectId = useMemo(() => params.projectId || params.id, [params]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "low",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const isAdmin = user?.role === "admin";
  const isPM = user?.role === "project-manager";

  const fetchProject = async () => {
    try {
      setLoadingProject(true);
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data?.data ?? null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load project");
    } finally {
      setLoadingProject(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await api.get(`/tasks/projects/${projectId}/tasks`);
      setTasks(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if ((isAdmin || isPM) && projectId) {
      api
        .get("/users")
        .then((res) => setUsers(res.data?.data || []))
        .catch((err) => console.error("Failed to load users:", err));
    }
  }, [isAdmin, isPM, projectId]);

  useEffect(() => {
    if (!projectId) return;
    fetchProject();
    fetchTasks();
  }, [projectId]);

  const createTask = async (e) => {
    e.preventDefault();
    if (!isPM && !isAdmin) return;

    const payload = {
      ...taskForm,
      assignedTo: taskForm.assignedTo ? [taskForm.assignedTo] : [],
    };

    try {
      await api.post(`/tasks/projects/${projectId}/tasks`, payload);
      setTaskForm({ title: "", description: "", assignedTo: "", priority: "low" });
      await fetchTasks();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    if (!isPM && !isAdmin) return;
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await fetchTasks();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    if (!isPM && !isAdmin) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete task");
    }
  };

  const deleteProject = async () => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this project and all tasks?")) return;
    try {
      await api.delete(`/projects/${projectId}`);
      navigate("/projects");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete project");
    }
  };

  const renderAssignees = (assignedTo) => {
    const arr = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
      ? [assignedTo]
      : [];

    if (arr.length === 0) return "—";

    return arr
      .map((a) =>
        typeof a === "string"
          ? a
          : `${a?.name || "Unknown"}${a?.email ? ` (${a.email})` : ""}`
      )
      .join(", ");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <Link to="/projects" className="text-blue-600 hover:underline">
          ← Back to Projects
        </Link>

        {project?._id && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                navigate(`/projects/${project._id}/chat`, {
                  state: { projectName: project.name },
                })
              }
              className="text-sm sm:text-base px-3 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 cursor-pointer"
            >
              Open Chat
            </button>

            <button
              onClick={() => navigate(`/board?projectId=${project._id}`)}
              className="text-sm sm:text-base px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              Open Board
            </button>

            {isAdmin && (
              <button
                onClick={deleteProject}
                className="text-sm sm:text-base px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Project info */}
      {loadingProject ? (
        <h2>Loading project…</h2>
      ) : project ? (
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">{project.name}</h1>
          <p className="text-gray-600">{project.description}</p>
        </div>
      ) : (
        <p className="text-red-500">Project not found.</p>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 rounded">{error}</div>
      )}

      <h2 className="text-2xl font-semibold mb-4">Tasks</h2>

      {/* Create Task */}
      {(isPM || isAdmin) && (
        <form
          onSubmit={createTask}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <input
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, title: e.target.value }))
            }
            className="px-3 py-2 rounded border w-full"
            required
          />
          <select
            value={taskForm.priority}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, priority: e.target.value }))
            }
            className="px-3 py-2 rounded border border-neutral-700 text-white w-full"
            style={{ backgroundColor: "#000212" }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <textarea
            placeholder="Task description"
            value={taskForm.description}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, description: e.target.value }))
            }
            className="px-3 py-2 rounded border w-full md:col-span-2"
            rows={3}
          />

          <select
            value={taskForm.assignedTo}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))
            }
            className="px-3 py-2 rounded border border-neutral-700 text-white w-full md:col-span-2"
            style={{ backgroundColor: "#000212" }}
          >
            <option value="">Assign to</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="text-sm sm:text-base px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto md:col-span-2"
          >
            Add Task
          </button>
        </form>
      )}

      {/* Task list */}
      {loadingTasks ? (
        <p>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500">No tasks yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((t) => (
            <div
              key={t._id}
              className="border rounded-lg p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <h3 className="font-medium text-lg">{t.title}</h3>
                {t.description && (
                  <p className="text-sm text-gray-600">{t.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  <b>Status:</b> {t.status || "todo"} {" | "}
                  <b>Assigned:</b> {renderAssignees(t.assignedTo)}
                </div>
              </div>

              {(isPM || isAdmin) && (
                <div className="flex flex-wrap gap-2">
                  <select
                    value={t.status || "todo"}
                    onChange={(e) => updateTaskStatus(t._id, e.target.value)}
                    className="text-sm px-2 py-1 rounded-md border border-neutral-700 text-white"
                    style={{ backgroundColor: "#000212" }}
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In-progress</option>
                    <option value="done">Done</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedTask(t);
                      setIsModalOpen(true);
                    }}
                    className="text-sm px-3 py-1 rounded-md bg-yellow-500 text-black"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteTask(t._id)}
                    className="text-sm px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      <TaskUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        onUpdated={() => fetchTasks()}
      />
    </div>
  );
}
