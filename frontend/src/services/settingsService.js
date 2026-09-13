import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// Get System Settings
// ==========================================
export async function getSettings() {
  try {
    const response = await axios.get(`${API_URL}/api/settings`);
    return response.data.data;
  } catch (error) {
    console.warn("Settings API unavailable, using defaults:", error?.message || error);
    return null;
  }
}

// ==========================================
// Update System Settings
// ==========================================
export async function updateSettings(data) {
  let headers = {};
  if (!(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await axios.put(`${API_URL}/api/settings`, data, { headers });
  return response.data;
}

// ==========================================
// Upload Logo Only
// ==========================================
export async function uploadLogo(file) {
  const formData = new FormData();
  formData.append("companyLogo", file);

  const response = await axios.post(`${API_URL}/api/settings/logo`, formData);
  return response.data;
}

// ==========================================
// Reset Settings to Factory Defaults
// ==========================================
export async function resetSettings() {
  const response = await axios.post(`${API_URL}/api/settings/reset`);
  return response.data;
}
