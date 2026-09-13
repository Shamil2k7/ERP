import apiClient from "./apiClient";

// GET /api/categories
export const getCategories = async () => {
  const response = await apiClient.get("/categories");
  return response.data;
};

// POST /api/categories
export const createCategory = async (data) => {
  const response = await apiClient.post("/categories", data);
  return response.data;
};

// PUT /api/categories/:id
export const updateCategory = async (id, data) => {
  const response = await apiClient.put(`/categories/${id}`, data);
  return response.data;
};

// DELETE /api/categories/:id
export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};
