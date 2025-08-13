import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });
          
          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          processQueue(null, token);
          
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
          
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Task service
export const taskService = {
  // Get all tasks for a project
  getProjectTasks: (projectId) => api.get(`/tasks/project/${projectId}`),
  
  // Create a new task
  createTask: (taskData) => api.post('/tasks', taskData),
  
  // Update a task
  updateTask: (taskId, updates) => api.put(`/tasks/${taskId}`, updates),
  
  // Delete a task
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  
  // Get a single task
  getTask: (taskId) => api.get(`/tasks/${taskId}`),
  
  // Add comment to task
  addComment: (taskId, comment) => api.post(`/tasks/${taskId}/comments`, { comment }),
  
  // Update task status
  updateTaskStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status })
};

// Project service
export const projectService = {
  // Get all projects
  getProjects: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/projects?${params}`);
  },

  // Get single project
  getProject: (projectId) => api.get(`/projects/${projectId}`),

  // Create project
  createProject: (projectData) => api.post('/projects', projectData),

  // Update project
  updateProject: (projectId, updates) => api.put(`/projects/${projectId}`, updates),

  // Delete project
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),

  // Add team member
  addTeamMember: (projectId, userId, role = 'member') => 
    api.post(`/projects/${projectId}/team`, { userId, role }),

  // Remove team member
  removeTeamMember: (projectId, userId) => 
    api.delete(`/projects/${projectId}/team/${userId}`)
};

export default api;