import apiClient from "./apiClient";

export const medicalService = {
  // Medical Shops (Branches of type MEDICAL_SHOP)
  getMedicalShops: async () => {
    const res = await apiClient.get("/medical/shops");
    return res.data;
  },
  createMedicalShop: async (data) => {
    const res = await apiClient.post("/medical/shops", data);
    return res.data;
  },

  // Medicines
  getMedicines: async (params = {}) => {
    const res = await apiClient.get("/medical/medicines/list", { params });
    return res.data;
  },
  getMedicineById: async (id) => {
    const res = await apiClient.get(`/medical/medicines/${id}`);
    return res.data;
  },
  createMedicine: async (data) => {
    const res = await apiClient.post("/medical/medicines", data);
    return res.data;
  },
  updateMedicine: async (id, data) => {
    const res = await apiClient.put(`/medical/medicines/${id}`, data);
    return res.data;
  },
  deleteMedicine: async (id) => {
    const res = await apiClient.delete(`/medical/medicines/${id}`);
    return res.data;
  },

  // Batches
  getBatches: async (params = {}) => {
    const res = await apiClient.get("/medical/batches/list", { params });
    return res.data;
  },
  getBatchById: async (id) => {
    const res = await apiClient.get(`/medical/batches/${id}`);
    return res.data;
  },
  createBatch: async (data) => {
    const res = await apiClient.post("/medical/batches", data);
    return res.data;
  },
  updateBatch: async (id, data) => {
    const res = await apiClient.put(`/medical/batches/${id}`, data);
    return res.data;
  },
  deleteBatch: async (id) => {
    const res = await apiClient.delete(`/medical/batches/${id}`);
    return res.data;
  },

  // FEFO stock deduction
  deductStockFEFO: async (data) => {
    const res = await apiClient.post("/medical/pos/deduct", data);
    return res.data;
  },

  // Prescriptions
  getPrescriptions: async (params = {}) => {
    const res = await apiClient.get("/medical/prescriptions/list", { params });
    return res.data;
  },
  getPrescriptionById: async (id) => {
    const res = await apiClient.get(`/medical/prescriptions/${id}`);
    return res.data;
  },
  createPrescription: async (data) => {
    const res = await apiClient.post("/medical/prescriptions", data);
    return res.data;
  },

  // Stats
  getDashboardStats: async () => {
    const res = await apiClient.get("/medical/dashboard/stats");
    return res.data;
  },

  // Returns
  getPurchaseReturns: async () => {
    const res = await apiClient.get("/returns/purchase");
    return res.data;
  },

  // Reports
  getReports: async () => {
    const res = await apiClient.get("/medical/dashboard/reports");
    return res.data;
  },
};
