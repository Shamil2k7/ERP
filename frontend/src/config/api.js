const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const cleanUrl = rawUrl.replace(/\/+$/, "");
const API_URL = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;

export default API_URL;
