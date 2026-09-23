import axios from "axios";

const client = axios.create({
  baseURL: `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// If the token is invalid/expired, force the user back to /login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default client;
