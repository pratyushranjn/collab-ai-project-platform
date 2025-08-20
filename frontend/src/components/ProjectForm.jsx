import React, { useState } from "react";
import api from "../api/api";

function ProjectForm({ onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const createProject = async () => {
    if (!name.trim() || !description.trim()) return;
    try {
      const res = await api.post("/projects", { name, description });
      onCreated(res.data.data);
      setName("");
      setDescription("");
    } catch (err) {
      setError("Failed to create project");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h2 className="text-xl font-semibold mb-2">Create Project</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className="w-full p-2 mb-2 rounded text-black"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Project description"
        className="w-full p-2 mb-2 rounded text-black"
      />
      <button
        onClick={createProject}
        className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
      >
        Create
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
}

export default ProjectForm;
