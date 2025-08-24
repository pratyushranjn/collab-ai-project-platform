import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function QuickCreateModal({
  isOpen,
  onClose,
  defaultProjectId,
  onCreated = () => {},
}) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [tab, setTab] = useState("task"); // 'task' | 'project'
  const [loading, setLoading] = useState(false);

  // Task fields
  const [task, setTask] = useState({
    projectId: defaultProjectId || "",
    title: "",
    description: "",
    priority: "low",
  });

  // Lists
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]); // ✅ for dropdown
  const [assignee, setAssignee] = useState("");

  // Project create fields
  const [project, setProject] = useState({ name: "", description: "", priority: "low" });
  const [projectManagerId, setProjectManagerId] = useState("");

  // Load users + projects when modal opens
  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      api.get("/users"),
      api.get("/projects"), // uses your existing getProjects
    ])
      .then(([usersRes, projectsRes]) => {
        setUsers(usersRes.data?.data || []);
        const list = (projectsRes.data?.data || []).map(p => ({ _id: p._id, name: p.name }));
        setProjects(list);
      })
      .catch(() => {
        setUsers([]);
        setProjects([]);
      });
  }, [isOpen]);

  // Pre-fill selected project if defaultProjectId provided
  useEffect(() => {
    if (defaultProjectId) {
      setTask(t => ({ ...t, projectId: defaultProjectId }));
    }
  }, [defaultProjectId]);

  if (!isOpen) return null;

  const close = () => {
    if (loading) return;
    onClose?.();
    setTask({
      projectId: defaultProjectId || "",
      title: "",
      description: "",
      priority: "low",
    });
    setProject({ name: "", description: "", priority: "low" });
    setAssignee("");
    setProjectManagerId("");
    setTab("task");
  };

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const createTask = async () => {
    if (!task.projectId) return toast.error("Select a project");
    if (!isValidObjectId(task.projectId)) return toast.error("Invalid project ID");
    if (!task.title.trim()) return toast.error("Task title is required");

    try {
      setLoading(true);

      const payload = {
        title: task.title.trim(),
        description: task.description.trim(),
        priority: task.priority,
        assignedTo: assignee ? [assignee] : [],
      };

      // IMPORTANT: Your backend routes live in taskRoutes,
      // so the real path is /api/tasks/projects/:projectId/tasks
      const { data } = await api.post(
        `/tasks/projects/${task.projectId}/tasks`,
        payload
      );

      if (data.success) {
        toast.success("Task created");
        onCreated({ type: "task", task: data.data });
        close();
      } else {
        toast.error(data.message || "Failed to create task");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create task");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!project.name.trim()) return toast.error("Project name is required");

    try {
      setLoading(true);
      const payload = {
        name: project.name.trim(),
        description: project.description.trim(),
        priority: project.priority,
        ...(isAdmin && projectManagerId ? { projectManager: projectManagerId } : {}),
      };

      const { data } = await api.post(`/projects`, payload);
      if (data.success) {
        toast.success("Project created");
        onCreated({ type: "project", project: data.data });
        close();
      } else {
        toast.error(data.message || "Failed to create project");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create project");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pmCandidates = users.filter((u) => u.role === "project-manager");

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      {/* modal */}
      <div className="relative w-full sm:max-w-lg bg-black text-white border border-gray-800 rounded-xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quick Create</h3>
          <button onClick={close} className="px-2 py-1 rounded hover:bg-gray-800">✕</button>
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1.5 rounded ${tab === "task" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
            onClick={() => setTab("task")}
          >
            Task
          </button>
          <button
            className={`px-3 py-1.5 rounded ${tab === "project" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
            onClick={() => setTab("project")}
          >
            Project
          </button>
        </div>

        {tab === "task" ? (
          <div className="space-y-3">
            {/* ✅ Project dropdown (hide if coming from a project page) */}
            {!defaultProjectId && (
              <select
                value={task.projectId}
                onChange={(e) => setTask({ ...task, projectId: e.target.value })}
                className="w-full px-3 py-2 rounded border border-neutral-700 text-white"
                style={{ backgroundColor: "#000000" }}
              >
                <option value="">Select project</option>
                {projects.length === 0 ? (
                  <option value="" disabled>No projects found</option>
                ) : (
                  projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))
                )}
              </select>
            )}

            <input
              type="text"
              placeholder="Task title"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <textarea
              placeholder="Description"
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              className="w-full px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              rows={3}
            />

            {/* Assignee dropdown */}
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-3 py-2 rounded border border-neutral-700 text-white"
              style={{ backgroundColor: "#000000" }}
            >
              <option value="">Assign to </option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>

            {/* Priority + Create */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <select
                value={task.priority}
                onChange={(e) => setTask({ ...task, priority: e.target.value })}
                className="px-3 py-2 rounded border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-auto"
                style={{ backgroundColor: "#000000" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <button
                disabled={loading}
                onClick={createTask}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 w-full sm:w-auto"
              >
                {loading ? "Creating…" : "Create Task"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Project name"
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              className="w-full px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <textarea
              placeholder="Description"
              value={project.description}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              className="w-full px-3 py-2 rounded border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              rows={3}
            />

            {/* Project priority */}
            <select
              value={project.priority}
              onChange={(e) => setProject({ ...project, priority: e.target.value })}
              className="px-3 py-2 rounded border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              style={{ backgroundColor: "#000000" }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {/* Project Manager (ADMIN ONLY) */}
            {isAdmin && (
              <select
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
                className="w-full px-3 py-2 rounded border border-neutral-700 text-white"
                style={{ backgroundColor: "#000000" }}
              >
                <option value="">Select Project Manager </option>
                {pmCandidates.length === 0 ? (
                  <option disabled value="">
                    No project-managers found
                  </option>
                ) : (
                  pmCandidates.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))
                )}
              </select>
            )}

            <div className="flex justify-end">
              <button
                disabled={loading}
                onClick={createProject}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create Project"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
