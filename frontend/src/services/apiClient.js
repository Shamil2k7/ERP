import axios from "axios";
import API_URL from "@/config/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const companyOverride = localStorage.getItem("companyOverride");
    const branchOverride = localStorage.getItem("branchOverride");

    if (companyOverride) {
      try {
        const parsed = JSON.parse(companyOverride);
        if (parsed?.id) {
          config.headers["x-company-override"] = parsed.id;
        }
      } catch (e) {}
    }

    if (branchOverride) {
      try {
        const parsed = JSON.parse(branchOverride);
        if (parsed?.id) {
          config.headers["x-branch-override"] = parsed.id;
        }
      } catch (e) {}
    }
  }
  return config;
});

export default apiClient;
