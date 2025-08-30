import { Link } from "react-router-dom";

export default function ChatUI() {
  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-white" style={{ backgroundColor: "#000212" }}>
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
        <p className="text-gray-400 text-sm mb-4">
          Start a conversation inside a project to keep things organized.
        </p>
        <div className="bg-gray-800 rounded-lg p-4 text-left text-sm mb-4">
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Open a project</li>
            <li>Click <span className="text-gray-100 font-medium">Open Chat</span> in the header</li>
            <li>Chat with your team in context</li>
          </ul>
        </div>
        <Link
          to="/projects"
          className="inline-block px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
        >
          Go to Projects
        </Link>
      </div>
    </div>
  );
}
