import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
      });

      newSocket.on('connect_error', (error) => {
        toast.error('Connection error. Some features may not work.');
      });

      newSocket.on('user_joined', (data) => {
        toast.success(`${data.user.name} joined the project`);
        setOnlineUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
      });

      newSocket.on('user_left', (data) => {
        toast(`${data.user.name} left the project`);
        setOnlineUsers(prev => prev.filter(u => u.id !== data.user.id));
      });

      newSocket.on('disconnect', () => {
        setSocket(null);
        setOnlineUsers([]);
      });

      return () => {
        newSocket.close();
        setSocket(null);
        setOnlineUsers([]);
      };
    }
  }, [isAuthenticated, token, user]);

  const joinProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('join_project', projectId);
      setCurrentProject(projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('leave_project', projectId);
      setCurrentProject(null);
      setOnlineUsers([]);
    }
  };

  const sendMessage = (projectId, content, type = 'text') => {
    if (socket) {
      socket.emit('send_message', { projectId, content, type });
    }
  };

  const updateWhiteboard = (projectId, action, object) => {
    if (socket) {
      socket.emit('whiteboard_update', { projectId, action, object });
    }
  };

  const moveCursor = (projectId, x, y) => {
    if (socket) {
      socket.emit('cursor_move', { projectId, x, y });
    }
  };

  const updateTask = (projectId, taskId, updates) => {
    if (socket) {
      socket.emit('task_update', { projectId, taskId, updates });
    }
  };

  const startTyping = (projectId, chatType = 'project') => {
    if (socket) {
      socket.emit('typing_start', { projectId, chatType });
    }
  };

  const stopTyping = (projectId, chatType = 'project') => {
    if (socket) {
      socket.emit('typing_stop', { projectId, chatType });
    }
  };

  const value = {
    socket,
    onlineUsers,
    currentProject,
    joinProject,
    leaveProject,
    sendMessage,
    updateWhiteboard,
    moveCursor,
    updateTask,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};