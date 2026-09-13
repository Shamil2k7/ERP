import apiClient from "./apiClient";

// GET /api/products
export const getProducts = async () => {
  const response = await apiClient.get("/products");
  return response.data;
};

// GET /api/products/:id
export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

// POST /api/products
export const createProduct = async (data) => {
  const response = await apiClient.post("/products", data);
  return response.data;
};

// PUT /api/products/:id
export const updateProduct = async (id, data) => {
  const response = await apiClient.put(`/products/${id}`, data);
  return response.data;
};

// DELETE /api/products/:id
export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data;
};
