import apiClient from "./apiClient";

export async function getSalesOrders() {
  const res = await apiClient.get("/sales");
  return res.data;
}

export async function getSalesOrderById(id) {
  const res = await apiClient.get(`/sales/${id}`);
  return res.data;
}

export async function createSalesOrder(data) {
  const res = await apiClient.post("/sales", data);
  return res.data;
}

export async function updateSalesOrder(id, data) {
  const res = await apiClient.put(`/sales/${id}`, data);
  return res.data;
}

export async function deleteSalesOrder(id) {
  const res = await apiClient.delete(`/sales/${id}`);
  return res.data;
}

export async function updateOrderStatus(id, status) {
  const res = await apiClient.patch(`/sales/${id}/status`, { status });
  return res.data;
}

export async function getCustomerOrders(customerId) {
  const res = await apiClient.get(`/sales/customer/${customerId}`);
  return res.data;
}

export async function getBranchOrders(branchId) {
  const res = await apiClient.get(`/sales/branch/${branchId}`);
  return res.data;
}

export async function getStatusOrders(status) {
  const res = await apiClient.get(`/sales/status/${status}`);
  return res.data;
}