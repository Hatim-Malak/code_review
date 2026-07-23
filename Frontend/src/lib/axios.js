import axios from "axios";
import toast from "react-hot-toast";

export const axiosInstance = new axios.create({
    baseURL:import.meta.env.MODE ==="development"? 'http://localhost:5000/api':"https://hatmind.duckdns.org/api",
    withCredentials:true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      toast.error("You're sending requests too fast. Please wait a moment.", { id: "rate-limit" });
    }
    return Promise.reject(error);
  }
);