import apiClient from "./apiClient";

const API_URL = "/customers";

// Generic / Shared Customer Endpoints
export const getCustomers = async (params = {}) => {
  const response = await apiClient.get(API_URL, { params });
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await apiClient.post(API_URL, data);
  return response.data;
};

export const updateCustomer = async (id, data) => {
  const response = await apiClient.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await apiClient.delete(`${API_URL}/${id}`);
  return response.data;
};

// Dedicated Textile ERP Customer Endpoints (100% Isolated)
export const getTextileCustomers = async (params = {}) => {
  const response = await apiClient.get("/textile/customers", { params });
  return response.data;
};

export const getTextileCustomerById = async (id) => {
  const response = await apiClient.get(`/textile/customers/${id}`);
  return response.data;
};

export const createTextileCustomer = async (data) => {
  const response = await apiClient.post("/textile/customers", data);
  return response.data;
};

export const updateTextileCustomer = async (id, data) => {
  const response = await apiClient.put(`/textile/customers/${id}`, data);
  return response.data;
};

export const deleteTextileCustomer = async (id) => {
  const response = await apiClient.delete(`/textile/customers/${id}`);
  return response.data;
};
