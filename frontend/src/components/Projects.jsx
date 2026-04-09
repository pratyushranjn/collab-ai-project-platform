import { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      setProjects(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen text-center">
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {projects.map((p) => (
            <li
              key={p._id}
              className="aspect-square bg-transparent border border-blue-500/40 rounded-2xl shadow-lg flex flex-col justify-between items-center p-6 relative group overflow-hidden hover:border-blue-400 hover:shadow-[0_0_16px_0_rgba(37,99,235,0.25)] transition-all duration-300"
            >
              <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold mb-2 text-white drop-shadow">{p.name}</h3>
                <small className="text-gray-400 block mb-3 truncate w-full">{p.description}</small>
                <div className="text-xs text-gray-300 flex flex-col gap-1 mb-2">
                  <span><span className="font-medium text-gray-200">Created by:</span> <span className="italic">{p?.createdBy?.name || "Unknown"}</span></span>
                  <span><span className="font-medium text-gray-200">Manager:</span> <span className="italic">{p?.projectManager?.name || "Not assigned"}</span></span>
                  {p.members?.length ? <span><span className="font-medium text-gray-200">Members:</span> {p.members.length}</span> : null}
                </div>
                <button
                  onClick={() => navigate(`/projects/${p._id}`)}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full font-semibold shadow"
                >
                  Open
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
