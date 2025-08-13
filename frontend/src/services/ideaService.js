import api from './api';

export const ideaService = {
  // Generate AI ideas
  generateIdeas: async (prompt, projectId) => {
    const response = await api.post('/ideas/generate', { prompt, projectId });
    return response.data;
  },

  // Get project ideas
  getProjectIdeas: async (projectId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/ideas/project/${projectId}?${params}`);
    return response.data;
  },

  // Create manual idea
  createIdea: async (ideaData) => {
    const response = await api.post('/ideas', ideaData);
    return response.data;
  },

  // Vote on idea
  voteOnIdea: async (ideaId, type) => {
    const response = await api.post(`/ideas/${ideaId}/vote`, { type });
    return response.data;
  },

  // Add comment to idea
  addComment: async (ideaId, text) => {
    const response = await api.post(`/ideas/${ideaId}/comments`, { text });
    return response.data;
  }
};