import { useState } from "react";

const initialColumns = {
  todo: {
    name: "To Do",
    items: [
      { id: 1, title: "Setup project repo" },
      { id: 2, title: "Design database schema" },
    ],
  },
  inProgress: {
    name: "In Progress",
    items: [
      { id: 3, title: "Implement authentication" },
    ],
  },
  done: {
    name: "Done",
    items: [
      { id: 4, title: "Install dependencies" },
    ],
  },
};

export default function KanbanBoard() {
  const [columns, setColumns] = useState(initialColumns);

  const handleAddTask = (columnKey) => {
    const title = prompt("Enter task title");
    if (!title) return;
    const newTask = { id: Date.now(), title };
    setColumns((prev) => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        items: [...prev[columnKey].items, newTask],
      },
    }));
  };

  return (
    <div className="flex gap-4 p-4 overflow-x-auto">
      {Object.entries(columns).map(([key, column]) => (
        <div key={key} className="bg-gray-800 text-white rounded-md w-72 flex-shrink-0 p-4">
          <h3 className="font-bold text-lg mb-2">{column.name}</h3>
          <div className="flex flex-col gap-2">
            {column.items.map((task) => (
              <div key={task.id} className="bg-gray-700 p-2 rounded shadow">
                {task.title}
              </div>
            ))}
          </div>
          <button
            onClick={() => handleAddTask(key)}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-1 rounded"
          >
            + Add Task
          </button>
        </div>
      ))}
    </div>
  );
}
