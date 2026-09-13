import apiClient from "./apiClient";

export const getBranches = async () => {
  const response = await apiClient.get("/branches");
  return response.data;
};

export const getBranchById = async (id) => {
  const response = await apiClient.get(`/branches/${id}`);
  return response.data;
};

export const createBranch = async (data) => {
  const response = await apiClient.post("/branches", data);
  return response.data;
};

export const updateBranch = async (id, data) => {
  const response = await apiClient.put(`/branches/${id}`, data);
  return response.data;
};

export const deleteBranch = async (id) => {
  const response = await apiClient.delete(`/branches/${id}`);
  return response.data;
};
