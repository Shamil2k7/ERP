import axios from "axios";
import API_URL from "@/config/api";

const adminAPI = axios.create({
  baseURL: `${API_URL}/admins`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token header interceptor
adminAPI.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// GET /api/admins
export const getAdmins = async () => {
  const response = await adminAPI.get("/");
  return response.data;
};

// GET /api/admins/:id
export const getAdminById = async (id) => {
  const response = await adminAPI.get(`/${id}`);
  return response.data;
};

// POST /api/admins
export const createAdmin = async (data) => {
  const response = await adminAPI.post("/", data);
  return response.data;
};

// DELETE /api/admins/:id
export const deleteAdmin = async (id) => {
  const response = await adminAPI.delete(`/${id}`);
  return response.data;
};
