import apiClient from "./apiClient";

// GET /api/inventory
export const getInventories = async () => {
  const response = await apiClient.get("/inventory");
  return response.data;
};

// GET /api/inventory/:id
export const getInventoryById = async (id) => {
  const response = await apiClient.get(`/inventory/${id}`);
  return response.data;
};

// POST /api/inventory
export const createInventory = async (data) => {
  const response = await apiClient.post("/inventory", data);
  return response.data;
};

// PUT /api/inventory/:id
export const updateInventory = async (id, data) => {
  const response = await apiClient.put(`/inventory/${id}`, data);
  return response.data;
};

// DELETE /api/inventory/:id
export const deleteInventory = async (id) => {
  const response = await apiClient.delete(`/inventory/${id}`);
  return response.data;
};
