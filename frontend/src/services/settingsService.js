import apiClient from "./apiClient";

// ==========================================
// Get System Settings
// ==========================================
export async function getSettings() {
  try {
    const response = await apiClient.get("/settings");
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
  const headers = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  } else {
    headers["Content-Type"] = "application/json";
  }

  const response = await apiClient.put("/settings", data, { headers });
  return response.data;
}

// ==========================================
// Upload Logo Only
// ==========================================
export async function uploadLogo(file) {
  const formData = new FormData();
  formData.append("companyLogo", file);

  const response = await apiClient.post("/settings/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ==========================================
// Reset Settings to Factory Defaults
// ==========================================
export async function resetSettings() {
  const response = await apiClient.post("/settings/reset");
  return response.data;
}

