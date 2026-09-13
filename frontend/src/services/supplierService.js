import apiClient from "./apiClient";

export const getSuppliers = async () => {
  const response = await apiClient.get("/suppliers");
  return response.data;
};

export const getSupplierById = async (id) => {
  const response = await apiClient.get(`/suppliers/${id}`);
  return response.data;
};

export const searchSuppliers = async (query) => {
  const response = await apiClient.get(`/suppliers/search?search=${encodeURIComponent(query)}`);
  return response.data;
};

export const createSupplier = async (data) => {
  const response = await apiClient.post("/suppliers", data);
  return response.data;
};

export const updateSupplier = async (id, data) => {
  const response = await apiClient.put(`/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplier = async (id) => {
  const response = await apiClient.delete(`/suppliers/${id}`);
  return response.data;
};
