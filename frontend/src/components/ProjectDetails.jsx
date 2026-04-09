import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useParams, Link, useNavigate } from "react-router-dom";
import TaskUpdateModal from "./TaskModal";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

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
      api.get("/users").then((res) => setUsers(res.data?.data || []));
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
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    if (!isPM && !isAdmin) return;
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    if (!isPM && !isAdmin) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const deleteProject = async () => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this project and all tasks?")) return;
    try {
      await api.delete(`/projects/${projectId}`);
      navigate("/projects");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    }
  };

  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return "";
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;

    const start = local.slice(0, 3);
    const end = local.length > 3 ? local.slice(-1) : "";
    return `${start}***${end}@${domain}`;
  };

  const renderAssignees = (assignedTo) => {
    const arr = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
        ? [assignedTo]
        : [];

    if (arr.length === 0) return "—";
    return arr
      .map((a) => {
        if (typeof a === "string") return a;
        if (!a) return "Unknown user";
        if (a.email) return `${a.name} (${maskEmail(a.email)})`;
        return a.name || "Unknown user";
      })
      .join(", ");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">

      {/* Back */}
      <Link to="/projects" className="text-sm text-gray-400 hover:text-white">
        ← Back
      </Link>

      {/* Project Header */}
      {project && (
        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-gray-400 mt-1">{project.description}</p>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() =>
                navigate(`/projects/${project._id}/chat`, {
                  state: { projectName: project.name },
                })
              }
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-md"
            >
              Chat
            </button>

            <button
              onClick={() => navigate(`/board?projectId=${project._id}`)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Board
            </button>

            {isAdmin && (
              <button
                onClick={deleteProject}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Task */}
      {(isPM || isAdmin) && (
        <form onSubmit={createTask} className="space-y-3 mb-6">
          <input
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, title: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-md bg-[#020617] border border-gray-700 focus:outline-none focus:border-blue-500"
            required
          />

          <textarea
            placeholder="Description"
            value={taskForm.description}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-md bg-[#020617] border border-gray-700"
          />

          <div className="flex gap-2">
            <select
              value={taskForm.priority}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, priority: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-md bg-[#020617] border border-gray-700"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <select
              value={taskForm.assignedTo}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-md bg-[#020617] border border-gray-700"
            >
              <option value="">Assign</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({maskEmail(u.email)})
                </option>
              ))}
            </select>
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm">
            Add Task
          </button>
        </form>
      )}

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((t) => (
          <div
            key={t._id}
            className="border border-gray-800 rounded-lg p-4 flex justify-between items-start"
          >
            <div>
              <h3 className="font-medium">{t.title}</h3>
              <p className="text-sm text-gray-400">{t.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t.status} • {renderAssignees(t.assignedTo)}
              </p>
            </div>

            {(isPM || isAdmin) && (
              <div className="flex flex-col gap-2">
                <select
                  value={t.status || "todo"}
                  onChange={(e) => updateTaskStatus(t._id, e.target.value)}
                  className="text-xs px-2 py-1 rounded bg-[#020617] border border-gray-700"
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
                  className="text-xs bg-yellow-500 text-black px-2 py-1 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteTask(t._id)}
                  className="text-xs bg-red-600 px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <TaskUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        onUpdated={() => fetchTasks()}
      />
    </div>
  );
}