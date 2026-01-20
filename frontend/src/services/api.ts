import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000, // 10 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para logs de debug
api.interceptors.request.use(
  (config) => {
    console.log("🚀 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", error.message);
    if (error.code === "ECONNABORTED") {
      console.error("⏱️ Request timeout - servidor não respondeu em 10 segundos");
    } else if (error.code === "ERR_NETWORK") {
      console.error("🌐 Network error - verifique se o backend está rodando");
    }
    return Promise.reject(error);
  }
);

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
