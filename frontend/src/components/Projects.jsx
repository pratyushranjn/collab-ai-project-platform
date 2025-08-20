import React, { useEffect, useState } from "react";
import { useParams, Link, Outlet } from "react-router-dom";
import api from "../api/api";

function Project() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMemberId, setNewMemberId] = useState("");
  const [error, setError] = useState("");

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data.data);
    } catch (err) {
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const addMember = async () => {
    if (!newMemberId.trim()) return;
    try {
      await api.post(`/projects/${projectId}/members`, { memberId: newMemberId });
      setNewMemberId("");
      fetchProject();
    } catch (err) {
      setError("Failed to add member");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      fetchProject();
    } catch (err) {
      setError("Failed to remove member");
    }
  };

  if (loading) return <p className="text-white">Loading project...</p>;
  if (!project) return <p className="text-red-500">Project not found</p>;

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
      <p className="mb-6 text-gray-300">{project.description}</p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Members</h2>
        <ul className="mb-4">
          {project.members.map((m) => (
            <li key={m._id} className="flex justify-between items-center bg-gray-800 p-2 rounded mb-2">
              <span>{m.name} ({m.email})</span>
              <button
                onClick={() => removeMember(m._id)}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
            placeholder="Enter userId..."
            className="flex-1 p-2 rounded text-black"
          />
          <button
            onClick={addMember}
            className="bg-blue-500 px-3 py-2 rounded hover:bg-blue-600"
          >
            Add Member
          </button>
        </div>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </div>

      {/* Links to tools */}
      <div className="flex gap-4 mb-6">
        <Link
          to={`/project/${projectId}/ai`}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          AI Ideas
        </Link>
        <Link
          to={`/project/${projectId}/tasks`}
          className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Tasks
        </Link>
      </div>

      <Outlet />
    </div>
  );
}

export default Project;
