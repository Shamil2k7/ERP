import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/audit`;

export const getAuditLogs = async (params = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(API_URL, {
    headers,
    params,
  });
  return response.data;
};

export const getAuditLogById = async (id) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(`${API_URL}/${id}`, {
    headers,
  });
  return response.data;
};
