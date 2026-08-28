import { axiosInstance } from "../lib/axios.js"
import {toast} from "react-hot-toast"
import {create} from "zustand"
import { persist } from "zustand/middleware"
import { useSettingsStore } from "./useSettingsStore.js"

export const useAuth = create(
  persist(
    (set, get) => ({
      authUser: null,
      isSigningUp: false,
      isSigningIn: false,
      isUpdatingProfile: false,
      isCheckingAuth: true,

      updateAuthUser: (user) => set({ authUser: user }),

      checkAuth: async () => {
        try {
          const res = await axiosInstance.get("/auth/check")
          set({ authUser: res.data })
        } catch (error) {
          console.log("error in checkAuth", error)
          set({ authUser: null })
        } finally {
          set({ isCheckingAuth: false })
        }
      },
      requestSignupOtp: async (data) => {
        try {
          const rawEmail = typeof data === "object" ? data?.email : data;
          const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
          if (!email) {
            toast.error("Email is required");
            return false;
          }
          const res = await axiosInstance.post("/auth/request-signup-otp", { email });
          toast.success(res.data.message || "OTP sent to email");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "An error occurred");
          return false;
        }
      },
      signUp: async (data) => {
        set({ isSigningUp: true })
        try {
          const payload = {
            ...data,
            email: typeof data.email === "string" ? data.email.trim().toLowerCase() : data.email,
          };
          const res = await axiosInstance.post("/auth/signup", payload)
          set({ authUser: res.data })
          toast.success("Account created successfully")
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "An error occurred");
          return false;
        } finally {
          set({ isSigningUp: false })
        }
      },
      signIn: async (data) => {
        set({ isSigningIn: true })
        try {
          const payload = {
            ...data,
            email: typeof data.email === "string" ? data.email.trim().toLowerCase() : data.email,
          };
          const res = await axiosInstance.post("/auth/login", payload)
          set({ authUser: res.data })
          toast.success("Logged in successfully")
        } catch (error) {
          toast.error(error.response?.data?.message || "An error occurred")
        } finally {
          set({ isSigningIn: false })
        }
      },
      logout: async () => {
        try {
          await axiosInstance.post("/auth/logout")
          set({ authUser: null })
          useAuth.persist.clearStorage();
          useSettingsStore.persist.clearStorage();
          toast.success("Logged out successfully")
        } catch (error) {
          toast.error(error.response?.data?.message || "An error occurred");
        }
      },
      forgotPassword: async (data) => {
        try {
          const rawEmail = typeof data === "object" ? data?.email : data;
          const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
          if (!email) {
            toast.error("Email is required");
            return false;
          }
          const res = await axiosInstance.post("/auth/forgot-password", { email });
          toast.success(res.data.message || "OTP sent if account exists");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "An error occurred");
          return false;
        }
      },
      resetPassword: async (data) => {
        try {
          const payload = {
            ...data,
            email: typeof data.email === "string" ? data.email.trim().toLowerCase() : data.email,
          };
          const res = await axiosInstance.post("/auth/reset-password", payload);
          toast.success(res.data.message || "Password reset successfully");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "An error occurred");
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      // Only persist the preferences part of the user to avoid flashing PII
      partialize: (state) => ({ 
        authUser: state.authUser ? { preferences: state.authUser.preferences, _id: state.authUser._id } : null 
      }),
    }
  )
)