import apiClient from "./apiClient";

export const laundryService = {
  // Profiles
  getLaundries: async () => {
    const res = await apiClient.get("/laundry");
    return res.data;
  },
  getLaundryById: async (id) => {
    const res = await apiClient.get(`/laundry/${id}`);
    return res.data;
  },
  createLaundry: async (data) => {
    const res = await apiClient.post("/laundry", data);
    return res.data;
  },
  updateLaundry: async (id, data) => {
    const res = await apiClient.put(`/laundry/${id}`, data);
    return res.data;
  },
  deleteLaundry: async (id) => {
    const res = await apiClient.delete(`/laundry/${id}`);
    return res.data;
  },

  // Categories
  getCategories: async (laundryId) => {
    const res = await apiClient.get("/laundry/categories/list", { params: { laundryId } });
    return res.data;
  },
  createCategory: async (data) => {
    const res = await apiClient.post("/laundry/categories", data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await apiClient.put(`/laundry/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await apiClient.delete(`/laundry/categories/${id}`);
    return res.data;
  },

  // Services
  getServices: async (laundryId, params = {}) => {
    const res = await apiClient.get("/laundry/services/list", { params: { laundryId, ...params } });
    return res.data;
  },
  createService: async (data) => {
    const res = await apiClient.post("/laundry/services", data);
    return res.data;
  },
  updateService: async (id, data) => {
    const res = await apiClient.put(`/laundry/services/${id}`, data);
    return res.data;
  },
  deleteService: async (id) => {
    const res = await apiClient.delete(`/laundry/services/${id}`);
    return res.data;
  },

  // Orders
  getOrders: async (params = {}) => {
    const res = await apiClient.get("/laundry/orders/list", { params });
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await apiClient.get(`/laundry/orders/${id}`);
    return res.data;
  },
  createOrder: async (data) => {
    const res = await apiClient.post("/laundry/orders", data);
    return res.data;
  },
  updateOrderStatus: async (id, status, notes = "") => {
    const res = await apiClient.put(`/laundry/orders/${id}/status`, { status, notes });
    return res.data;
  },

  // Garment tracking
  getGarments: async (params = {}) => {
    const res = await apiClient.get("/laundry/garments", { params });
    return res.data;
  },
  createGarment: async (data) => {
    const res = await apiClient.post("/laundry/garments", data);
    return res.data;
  },
  scanGarment: async (barcode) => {
    const res = await apiClient.get(`/laundry/garments/scan/${barcode}`);
    return res.data;
  },
  updateGarmentStatus: async (id, status) => {
    const res = await apiClient.put(`/laundry/garments/${id}/status`, { status });
    return res.data;
  },

  // Delivery Tracking
  getDeliveries: async (params = {}) => {
    const res = await apiClient.get("/laundry/deliveries", { params });
    return res.data;
  },
  updateDeliveryStatus: async (orderId, data) => {
    const res = await apiClient.put(`/laundry/orders/${orderId}/delivery`, data);
    return res.data;
  },

  // Stats
  getLaundryStats: async (laundryId) => {
    const res = await apiClient.get("/laundry/dashboard/stats", { params: { laundryId } });
    return res.data;
  },

  // Reports
  getLaundryReports: async (laundryId) => {
    const res = await apiClient.get("/laundry/dashboard/reports", { params: { laundryId } });
    return res.data;
  },
};
