import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/roles`;

export const getRoles = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getRoleById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createRole = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const updateRole = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
