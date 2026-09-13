import apiClient from "./apiClient";

// ==============================
// GET LANDING PAGE
// ==============================
export async function getLandingPage() {
  const response = await apiClient.get("/landing");
  return response.data.data;
}

// ==============================
// UPDATE LANDING PAGE
// ==============================
export async function updateLandingPage(formData) {
  const response = await apiClient.put("/landing", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}