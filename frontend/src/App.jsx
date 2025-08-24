import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import LandingPage from "./pages/LandingPage";
import Projects from "./components/Projects";
import AIIdeas from "./pages/aiIdeas";
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
import UpdateProfileModal from "./components/updateProfileModal";
import Page404 from "./pages/page404";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public Page*/}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

            {/* Protected (inside app layout) */}
            <Route element={<Layout />}>
              <Route path="/task" element={<ProtectedRoute><TaskComponent /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        
              <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
              <Route path="/projects/:projectId/chat" element={<ProtectedRoute><ChatUI /></ProtectedRoute>} />

              <Route path="/ai" element={<ProtectedRoute><AIIdeas /></ProtectedRoute>} />
              <Route path="/mindmap" element={<ProtectedRoute><MindMap /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />
              <Route path="/board" element={<ProtectedRoute><KanbanBoardPage /></ProtectedRoute>} />

              <Route path="/chat" element={<ProtectedRoute><Navigate to="/projects" replace /></ProtectedRoute>} />
            </Route>

            {/* 404 Page*/}
            <Route path="*" element={< Page404 />  }/> </Routes>
          
          <UpdateProfileModal isOpen={isModalOpen} onClose={closeModal} />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
