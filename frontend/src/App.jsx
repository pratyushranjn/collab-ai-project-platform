import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationsProvider } from "./context/NotificationsContext";

import LandingPage from "./pages/LandingPage";
import Projects from "./components/Projects";
import AIIdeas from "./pages/AiIdeas";
import MindMap from "./pages/MindMap";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import KanbanBoardPage from "./pages/KanbanBoard";

import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layouts/AppLayout";
import ChatUI from "./pages/ChatUI";
import TaskComponent from "./pages/Tasks";
import ProjectDetails from "./components/ProjectDetails";
import UpdateProfileModal from "./components/UpdateProfileModal";
import Page404 from "./pages/Page404";
import ProjectChat from "./pages/ProjectChat";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationsProvider >
          <Router>
            <Routes>
              {/* Public */}
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

              {/* Protected (inside app layout) */}
              <Route element={<Layout />}>
                <Route path="/task" element={<ProtectedRoute><TaskComponent /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />

                {/* NESTED project routes (single definition) */}
                <Route path="/projects/:projectId" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                  <Route index element={<ProjectDetails />} />
                  <Route path="chat" element={<ProjectChat />} />
                </Route>

                {/* Other app routes */}
                <Route path="/chat" element={<ProtectedRoute><ChatUI /></ProtectedRoute>} />
                <Route path="/ai" element={<ProtectedRoute><AIIdeas /></ProtectedRoute>} />
                <Route path="/mindmap" element={<ProtectedRoute><MindMap /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute ><Dashboard /></ProtectedRoute>} />
                <Route path="/panel" element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />
                <Route path="/board" element={<ProtectedRoute><KanbanBoardPage /></ProtectedRoute>} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Page404 />} />
            </Routes>

            <UpdateProfileModal isOpen={isModalOpen} onClose={closeModal} />
          </Router>
        </NotificationsProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
