import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const defaultLandingData = {
  logoText: "ERP",
  logoHighlight: "Cloud",
  loginText: "Login →",
  heroTag: "CLOUD ERP PLATFORM",
  heroTitle: "Transform Your Business With ERP",
  heroDescription:
    "A powerful cloud-based ERP platform that helps businesses manage inventory, billing, accounting, warehouses and analytics.",
  heroImage: "",
  heroBackgroundImage: "",
  heroButtonText: "Upgrade Your Company In Minutes",
  dashboardTitle: "ERP Dashboard",
  dashboardSubtitle: "Business Overview",
  aboutTag: "ABOUT ERP CLOUD",
  aboutTitle: "One Platform. Complete Business Control.",
  aboutDescription:
    "ERP Cloud helps retailers and businesses manage everything from one intelligent system.",
  aboutImage1: "",
  aboutImage2: "",
  aboutImage3: "",
  aboutImage4: "",
  footerText: "© ERP Cloud. All Rights Reserved.",
};

export async function getLandingPage() {
  try {
    const response = await axios.get(`${API_URL}/api/landing`);
    return response.data?.data || defaultLandingData;
  } catch (error) {
    console.warn("Landing API unavailable, using default data:", error?.message || error);
    return defaultLandingData;
  }
}