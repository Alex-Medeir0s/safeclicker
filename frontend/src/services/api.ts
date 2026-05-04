import axios from "axios";

const browserHost = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
// Normalizar hosts que podem aparecer em ambiente de dev (0.0.0.0 ou vazio)
const normalizedHost = browserHost === "0.0.0.0" || !browserHost ? "127.0.0.1" : browserHost;
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || `http://${normalizedHost}:8000`).replace(/\/$/, "");

// Log útil para debugging em dev: mostra qual baseURL o frontend está usando
if (typeof window !== "undefined") {
  console.log("[api] API_BASE_URL:", API_BASE_URL);
}

export const api = axios.create({
  // Em ambiente local de rede, usa o hostname atual do navegador por padrão.
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    // Adicionar token JWT se existir
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Remove trailing slash da URL
    if (config.url && config.url.endsWith("/") && config.url !== "/") {
      config.url = config.url.slice(0, -1);
    }
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
      console.error("⏱️ Request timeout - servidor não respondeu em 30 segundos. Verifique se o backend está rodando com: uvicorn app.main:app --reload");
    } else if (error.code === "ERR_NETWORK") {
      console.error(`🌐 Network error - verifique se o backend está rodando em ${API_BASE_URL}`);
    } else if (error.response?.status === 401) {
      console.error("🔒 Unauthorized - redirecionando para login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
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
