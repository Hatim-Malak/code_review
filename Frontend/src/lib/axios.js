import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../store/useAuthStore.js";
import { useSettingsStore } from "../store/useSettingsStore.js";

export const axiosInstance = new axios.create({
    baseURL:import.meta.env.MODE ==="development"? 'http://localhost:5000/api':"https://hatmind.duckdns.org/api",
    withCredentials:true,
});

let refreshTokenPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      toast.error("You're sending requests too fast. Please wait a moment.", { id: "rate-limit" });
    }

    const originalRequest = error.config;

    // If error is 401 and it's not the refresh endpoint itself
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;

      try {
        // If a refresh is already in flight, wait for it
        if (!refreshTokenPromise) {
          refreshTokenPromise = axiosInstance.get('/auth/refresh');
        }
        await refreshTokenPromise;
        
        // After successful refresh, retry original request
        refreshTokenPromise = null;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        refreshTokenPromise = null;
        // Refresh failed (token expired, invalid tokenVersion, or user not logged in)
        // Explicitly clear persisted stores to prevent stale/wrong user flashes
        useAuth.persist?.clearStorage();
        useSettingsStore.persist?.clearStorage();
        useAuth.getState().updateAuthUser(null);
        
        return Promise.reject(refreshError);
      }
    }

    // Also clear if the refresh itself returns 401
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh') {
        useAuth.persist?.clearStorage();
        useSettingsStore.persist?.clearStorage();
        useAuth.getState().updateAuthUser(null);
    }

    return Promise.reject(error);
  }
);