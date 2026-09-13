import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==============================
// GET LANDING PAGE
// ==============================

export async function getLandingPage() {
  const response = await axios.get(`${API_URL}/api/landing`);
  return response.data.data;
}

// ==============================
// UPDATE LANDING PAGE
// ==============================

export async function updateLandingPage(formData) {
  const response = await axios.put(`${API_URL}/api/landing`, formData);
  return response.data;
}