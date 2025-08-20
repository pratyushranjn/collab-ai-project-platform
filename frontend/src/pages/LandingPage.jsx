import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-6 py-12">
      {/* Hero Section */}
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
        Welcome to <span className="text-blue-500 ">AI CollabHub</span>
      </h1>
      <p className="text-base md:text-xl text-gray-300 max-w-2xl mb-8 text-center">
        Collab-AI is a collaborative project management platform that helps 
        teams brainstorm, organize, and execute ideas with AI-powered 
        assistance and real-time collaboration tools.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-16 w-full sm:w-auto justify-center">
        <Link
          to="/projects"
          className="px-6 py-3 text-center bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors w-full sm:w-auto"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/pratyushranjn/collab-ai-project-platform"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 text-center bg-gray-700 hover:bg-gray-600 rounded-lg shadow-lg transition-colors w-full sm:w-auto"
        >
          View on GitHub
        </a>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl w-full px-2">
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-blue-400">AI Ideation</h3>
          <p className="text-gray-400 text-sm md:text-base">
            Generate innovative ideas and project insights powered by AI.
          </p>
        </div>
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-blue-400">Kanban Board</h3>
          <p className="text-gray-400 text-sm md:text-base">
            Organize tasks visually, track progress, and keep your team aligned.
          </p>
        </div>
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-blue-400">Real-time Chat</h3>
          <p className="text-gray-400 text-sm md:text-base">
            Communicate instantly with your team for seamless collaboration.
          </p>
        </div>
      </div>

      {/* Why Use Section */}
      {/* <div className="mt-20 max-w-3xl w-full px-2">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-blue-500">
          Why use Collab-AI?
        </h2>
        <ul className="space-y-4 text-gray-300 text-sm md:text-base">
          <li className="flex items-start">
            <span className="text-blue-400 mr-2">✔</span>
            Boost productivity with AI-driven suggestions and automation.
          </li>
          <li className="flex items-start">
            <span className="text-blue-400 mr-2">✔</span>
            Simplify collaboration with real-time boards, chat, and whiteboards.
          </li>
          <li className="flex items-start">
            <span className="text-blue-400 mr-2">✔</span>
            Stay organized with task tracking, role-based access, and version control.
          </li>
          <li className="flex items-start">
            <span className="text-blue-400 mr-2">✔</span>
            Gain actionable insights with analytics and AI-powered dashboards.
          </li>
        </ul>
      </div> */}

    </div>
  );
}

