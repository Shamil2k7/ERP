import apiClient from "./apiClient";

// GET /api/warehouses
export const getWarehouses = async () => {
  const response = await apiClient.get("/warehouses");
  return response.data;
};

// GET /api/warehouses/:id
export const getWarehouseById = async (id) => {
  const response = await apiClient.get(`/warehouses/${id}`);
  return response.data;
};

// GET /api/warehouses/search
export const searchWarehouses = async (query) => {
  const response = await apiClient.get("/warehouses/search", {
    params: {
      search: query,
    },
  });

  return response.data;
};

// POST /api/warehouses
export const createWarehouse = async (data) => {
  const response = await apiClient.post("/warehouses", data);
  return response.data;
};

// PUT /api/warehouses/:id
export const updateWarehouse = async (id, data) => {
  const response = await apiClient.put(`/warehouses/${id}`, data);
  return response.data;
};

// DELETE /api/warehouses/:id
export const deleteWarehouse = async (id) => {
  const response = await apiClient.delete(`/warehouses/${id}`);
  return response.data;
};