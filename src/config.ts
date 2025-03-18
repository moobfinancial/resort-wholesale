// API configuration
export const API_BASE_URL =
  import.meta.env.NODE_ENV === "production"
    ? (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api"
    : "http://localhost:3000/api";
