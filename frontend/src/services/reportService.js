import apiClient from "./apiClient";

/**
 * Fetch Sales Report with parameters (startDate, endDate, groupBy, customerId)
 */
export const getSalesReport = async (params) => {
  const response = await apiClient.get("/reports/sales", { params });
  return response.data;
};

/**
 * Fetch Purchase Report with parameters (startDate, endDate, groupBy, supplierId)
 */
export const getPurchaseReport = async (params) => {
  const response = await apiClient.get("/reports/purchases", { params });
  return response.data;
};

/**
 * Fetch Inventory Report with parameters (warehouseId)
 */
export const getInventoryReport = async (params) => {
  const response = await apiClient.get("/reports/inventory", { params });
  return response.data;
};

/**
 * Fetch Report filter options (customers, suppliers, warehouses)
 */
export const getReportFilters = async () => {
  const response = await apiClient.get("/reports/filters");
  return response.data;
};
