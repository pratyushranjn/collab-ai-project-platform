import api from "./api";

export const getAdminSummary = () =>
  api.get("/admin/dashboard/summary").then((r) => r.data);
export const getAdminUsers = (params) =>
  api.get("/admin/users", { params }).then((r) => r.data);
export const getAdminProjects = (params) =>
  api.get("/admin/projects", { params }).then((r) => r.data);
export const getProjectAnalytics = (projectId) =>
  api.get(`/admin/analytics/projects/${projectId}`).then((r) => r.data);


export const getAdminProjectById = (id) =>
  api.get(`/admin/projects/${id}`).then((r) => r.data);

export const updateAdminProject = (id, payload) =>
  api.put(`/admin/projects/${id}`, payload).then((r) => r.data);

export const deleteAdminProject = (id) =>
  api.delete(`/admin/projects/${id}`).then((r) => r.data);

export const addAdminMemberByEmail = (id, email) =>
  api.post(`/admin/projects/${id}/members/by-email`, { email }).then((r) => r.data);

export const removeAdminMember = (id, memberId) =>
  api.delete(`/admin/projects/${id}/members/${memberId}`).then((r) => r.data);