import api from './api';

export const projectService = {
  // Get all projects
  getProjects: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/projects?${params}`);
    return response.data;
  },

  // Get single project
  getProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  // Create project
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (projectId, updates) => {
    const response = await api.put(`/projects/${projectId}`, updates);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  // Add team member
  addTeamMember: async (projectId, userId, role = 'member') => {
    const response = await api.post(`/projects/${projectId}/team`, { userId, role });
    return response.data;
  },

  // Remove team member
  removeTeamMember: async (projectId, userId) => {
    const response = await api.delete(`/projects/${projectId}/team/${userId}`);
    return response.data;
  }
};