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
    <div className="max-w-3xl mx-auto p-4">
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
        <ul className="grid gap-3">
          {projects.map((p) => (
            <li
              key={p._id}
              className="border border-gray-300 p-4 rounded-lg"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <small className="text-gray-500 block">
                    {p.description}
                  </small>

                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">
                      Created by:
                    </span>{" "}
                    <span className="italic">
                      {p?.createdBy?.name || "Unknown"}
                    </span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="font-medium text-gray-700">
                      Project Manager:
                    </span>{" "}
                    <span className="italic">
                      {p?.projectManager?.name || "Not assigned"}
                    </span>
                  </p>
                </div>

                <div className="flex md:justify-end">
                  <button
                    onClick={() => navigate(`/projects/${p._id}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer w-full md:w-auto"
                  >
                    Open
                  </button>
                </div>
              </div>

              {p.members?.length ? (
                <div className="mt-2">
                  <small className="text-gray-600">
                    Members: {p.members.length}
                  </small>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
