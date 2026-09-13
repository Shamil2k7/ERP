import apiClient from "./apiClient";

/**
 * Dedicated Textile ERP Employee & Staff Endpoints (100% Database Isolated)
 */

export const getTextileEmployees = async (params = {}) => {
  const response = await apiClient.get("/textile/employees", { params });
  return response.data;
};

export const getTextileEmployeeById = async (id) => {
  const response = await apiClient.get(`/textile/employees/${id}`);
  return response.data;
};

export const createTextileEmployee = async (data) => {
  const response = await apiClient.post("/textile/employees", data);
  return response.data;
};

export const updateTextileEmployee = async (id, data) => {
  const response = await apiClient.put(`/textile/employees/${id}`, data);
  return response.data;
};

export const deleteTextileEmployee = async (id) => {
  const response = await apiClient.delete(`/textile/employees/${id}`);
  return response.data;
};
