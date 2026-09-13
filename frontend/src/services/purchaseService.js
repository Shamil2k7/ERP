import apiClient from "./apiClient";

export const getPurchases = async () => {
  const response = await apiClient.get("/purchases");
  return response.data;
};

export const getPurchase = async (id) => {
  const response = await apiClient.get(`/purchases/${id}`);
  return response.data;
};

export const createPurchase = async (data) => {
  const response = await apiClient.post("/purchases", data);
  return response.data;
};

export const updatePurchase = async (id, data) => {
  const response = await apiClient.put(`/purchases/${id}`, data);
  return response.data;
};

export const deletePurchase = async (id) => {
  const response = await apiClient.delete(`/purchases/${id}`);
  return response.data;
};