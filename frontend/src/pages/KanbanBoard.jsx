import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function KanbanBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = useMemo(() => searchParams.get("projectId") || "", [searchParams]);

  const [projects, setProjects] = useState([]); // [{_id, name}]
  const [projectName, setProjectName] = useState("Project");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState("");

  const [columns, setColumns] = useState({
    todo: { name: "To Do", tasks: [] },
    "in-progress": { name: "In Progress", tasks: [] },
    done: { name: "Done", tasks: [] },
  });

  useEffect(() => {
    setLoadingProjects(true);
    api
      .get("/projects")
      .then((res) => {
        const list = (res.data?.data || []).map((p) => ({ _id: p._id, name: p.name }));
        setProjects(list);
      })
      .catch((e) => {
        console.error("Projects load failed", e.response?.data || e.message);
        setProjects([]);
      })
      .finally(() => setLoadingProjects(false));
  }, []);


  useEffect(() => {
    if (!projectId) {
      setProjectName("Project");
      setColumns({
        todo: { name: "To Do", tasks: [] },
        "in-progress": { name: "In Progress", tasks: [] },
        done: { name: "Done", tasks: [] },
      });
      setError("");
      return;
    }
    (async () => {
      try {
        const res = await api.get(`/projects/${projectId}`);
        setProjectName(res.data?.data?.name || "Project");
      } catch {
        setProjectName("Project");
      }
    })();
  }, [projectId]);

  // load tasks for selected project
  useEffect(() => {
    if (!projectId) return;
    setLoadingTasks(true);
    (async () => {
      try {
        const res = await api.get(`/tasks/projects/${projectId}/tasks`);
        const tasks = res.data?.data || [];
        const grouped = {
          todo: { name: "To Do", tasks: [] },
          "in-progress": { name: "In Progress", tasks: [] },
          done: { name: "Done", tasks: [] },
        };
        tasks.forEach((t) => {
          const status = String(t.status || "todo").toLowerCase();
          if (grouped[status]) {
            grouped[status].tasks.push({
              id: String(t._id),                // string draggableId
              title: t.title,
              description: t.description,
              priority: t.priority || "low",
            });
          }
        });
        setColumns(grouped);
        setError("");
      } catch (e) {
        console.error("Tasks load failed", e.response?.data || e.message);
        setError(e.response?.data?.message || "Failed to load tasks");
      } finally {
        setLoadingTasks(false);
      }
    })();
  }, [projectId]);

  // drag & drop
  const onDragEnd = useCallback(async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const from = source.droppableId;
    const to = destination.droppableId;

    if (from === to) {
      setColumns((prev) => {
        const col = prev[from];
        const items = [...col.tasks];
        const [moved] = items.splice(source.index, 1);
        items.splice(destination.index, 0, moved);
        return { ...prev, [from]: { ...col, tasks: items } };
      });
      return;
    }

    // move across colms
    let movedTask;
    setColumns((prev) => {
      const fromCol = prev[from];
      const toCol = prev[to];
      const fromTasks = [...fromCol.tasks];
      const toTasks = [...toCol.tasks];
      [movedTask] = fromTasks.splice(source.index, 1);
      toTasks.splice(destination.index, 0, movedTask);
      return {
        ...prev,
        [from]: { ...fromCol, tasks: fromTasks },
        [to]: { ...toCol, tasks: toTasks },
      };
    });

    // persist new status
    try {
      await api.put(`/tasks/${movedTask.id}`, { status: to });
    } catch (e) {
      console.error("Status update failed", e.response?.data || e.message);
    }
  }, []);

  const statusMeta = {
    todo: { title: "To Do", dot: "bg-yellow-400", pulse: true, empty: "No tasks yet 💤" },
    "in-progress": { title: "In Progress", dot: "bg-blue-500", pulse: true, empty: "Nothing cooking yet 🍳" },
    done: { title: "Done", dot: "bg-emerald-500", pulse: false, empty: "All clear here ✅" },
  };
  const priorityColor = (p = "low") =>
    ({ high: "bg-red-600", medium: "bg-amber-600", low: "bg-emerald-600" }[String(p).toLowerCase()] || "bg-slate-600");

  const handleSelectProject = (e) => {
    const id = e.target.value;
    if (!id) {
      const next = new URLSearchParams(searchParams);
      next.delete("projectId");
      setSearchParams(next);
      return;
    }
    setSearchParams({ projectId: id });
  };

  const allEmpty =
    columns.todo.tasks.length === 0 &&
    columns["in-progress"].tasks.length === 0 &&
    columns.done.tasks.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-50 truncate">
          {projectId ? projectName : "Pick a project"}
        </h1>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300 hidden sm:block">Project:</label>
          <select
            value={projectId}
            onChange={handleSelectProject}
            className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-white"
          >
            <option value="">{loadingProjects ? "Loading..." : "Select a project"}</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {!projectId ? (
          <div className="text-slate-300">Choose a project from the dropdown to view its board.</div>
        ) : loadingTasks ? (
          <div className="text-slate-300">Loading tasks…</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <>
            {allEmpty && (
              <div className="mb-4 text-slate-300">
                No tasks yet 💤 — drag & drop will activate once you add some.
              </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-flow-col auto-cols-[minmax(280px,290px)] gap-4 overflow-x-auto pr-2 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                {Object.entries(columns).map(([colId, col]) => {
                  const meta = statusMeta[colId] || { title: col.name, dot: "bg-slate-500", pulse: false, empty: "No tasks" };
                  return (
                    <div key={colId} className="bg-slate-800 rounded-lg p-3 w-72 flex flex-col shadow-lg min-h-[80vh]">
                      {/* Column header */}
                      <div className="flex items-center justify-between mb-4 pb-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot} ${meta.pulse ? "animate-pulse" : ""}`} />
                          <h2 className="font-semibold text-slate-100 text-lg">{meta.title}</h2>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-700 text-sm text-slate-300">{col.tasks.length}</span>
                      </div>

                      {/* Droppable area */}
                      <Droppable droppableId={colId}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 space-y-3 min-h-[100px]">
                            {col.tasks.length === 0 ? (
                              <div className="text-slate-400 text-sm italic p-3 border border-slate-700/60 rounded-lg bg-slate-900/60">
                                {meta.empty}
                              </div>
                            ) : (
                              col.tasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`relative p-4 rounded-lg shadow-md bg-slate-950 border border-slate-800 transition ${
                                        snapshot.isDragging ? "ring-2 ring-blue-500" : "hover:border-blue-500"
                                      }`}
                                    >
                                      {/* left priority bar */}
                                      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${priorityColor(task.priority)}`} />
                                      {/* content */}
                                      <h4 className="text-slate-100 font-semibold text-base mb-1">{task.title}</h4>
                                      {task.description && (
                                        <p className="text-slate-400 text-sm">{task.description}</p>
                                      )}
                                      {/* footer */}
                                      <div className="mt-3 flex items-center justify-between">
                                        <span className={`text-white text-xs font-semibold px-2 py-1 rounded-full capitalize ${priorityColor(task.priority)}`}>
                                          {String(task.priority || "low").toLowerCase()}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </>
        )}
      </div>
    </div>
  );
}
