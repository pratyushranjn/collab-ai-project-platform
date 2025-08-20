import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import Projects from "./components/Projects";
import AIIdeas from "./pages/AIideas";
import MindMap from "./pages/MindMap";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import KanbanBoardPage from "./pages/KanbanBoard"; 

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layouts/AppLayout";
import ChatUI from "./pages/ChatUI";
import ProjectForm from "./components/ProjectForm";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Protected pages inside Layout (Navbar + Sidebar) */}
          <Route element={<Layout />}>
            {/* <Route path="/home" element={<ProtectedRoute><chat /></ProtectedRoute>} /> */}
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatUI /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><AIIdeas /></ProtectedRoute>} />
            <Route path="/mindmap" element={<ProtectedRoute><MindMap /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />
            <Route path="/board" element={<ProtectedRoute><KanbanBoardPage /></ProtectedRoute>} /> 
          </Route>

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen 
                    bg-gradient-to-br from-gray-900 via-black to-gray-800 text-red-500 px-6 text-center">
                <h4 className="text-2xl md:text-3xl font-semibold mb-3">
                  404 - Page Not Found
                </h4>
                <Link
                  to="/projects"
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
              Go to Home
                </Link>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
