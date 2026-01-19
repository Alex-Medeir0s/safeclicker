import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  register: (data: { email: string; password: string }) =>
    api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
};

// Users API
export const usersAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get(`/users?skip=${skip}&limit=${limit}`),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post("/users", data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Campaigns API
export const campaignsAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get(`/campaigns?skip=${skip}&limit=${limit}`),
  getById: (id: number) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post("/campaigns", data),
  update: (id: number, data: any) => api.put(`/campaigns/${id}`, data),
  delete: (id: number) => api.delete(`/campaigns/${id}`),
};

// Templates API
export const templatesAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get(`/templates?skip=${skip}&limit=${limit}`),
  getById: (id: number) => api.get(`/templates/${id}`),
  create: (data: any) => api.post("/templates", data),
  delete: (id: number) => api.delete(`/templates/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get(`/departments?skip=${skip}&limit=${limit}`),
  getById: (id: number) => api.get(`/departments/${id}`),
  create: (data: any) => api.post("/departments", data),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

// Health check
export const healthAPI = {
  check: () => api.get("/health"),
};

export default api;
