import api from './api';

export const whiteboardService = {
  // Get project whiteboards
  getProjectWhiteboards: async (projectId) => {
    const response = await api.get(`/whiteboards/projects/${projectId}`);
    return response.data;
  },

  // Get single whiteboard
  getWhiteboard: async (whiteboardId) => {
    const response = await api.get(`/whiteboards/${whiteboardId}`);
    return response.data;
  },

  // Create whiteboard for a specific project
  createWhiteboard: async (projectId, whiteboardData) => {
    const response = await api.post(`/whiteboards/projects/${projectId}`, whiteboardData);
    return response.data;
  },

  // Update whiteboard
  updateWhiteboard: async (whiteboardId, updates) => {
    const response = await api.put(`/whiteboards/${whiteboardId}`, updates);
    return response.data;
  },

  // Add object to whiteboard
  addObject: async (whiteboardId, objectData) => {
    const response = await api.post(`/whiteboards/${whiteboardId}/objects`, objectData);
    return response.data;
  },

  // Update object in whiteboard
  updateObject: async (whiteboardId, objectId, updates) => {
    try {
      const response = await api.put(`/whiteboards/${whiteboardId}/objects/${objectId}`, updates);
      return response.data;
    } catch (error) {
      // If object not found, it might still be creating - throw specific error
      if (error.response?.status === 404) {
        const notFoundError = new Error('Object not found - may still be creating');
        notFoundError.status = 404;
        notFoundError.originalError = error;
        throw notFoundError;
      }
      throw error;
    }
  },

  // Delete object from whiteboard
  deleteObject: async (whiteboardId, objectId) => {
    const response = await api.delete(`/whiteboards/${whiteboardId}/objects/${objectId}`);
    return response.data;
  },

  // Update cursor position
  updateCursor: async (whiteboardId, x, y, color) => {
    const response = await api.put(`/whiteboards/${whiteboardId}/cursor`, { x, y, color });
    return response.data;
  },

  // Clear whiteboard (remove all objects)
  clearWhiteboard: async (whiteboardId) => {
    const response = await api.delete(`/whiteboards/${whiteboardId}/objects`);
    return response.data;
  }
};