import { axiosInstance } from "../lib/axios.js"
import {toast} from "react-hot-toast"
import {create} from "zustand"

export const useAuth = create((set,get)=>({
    authUser:null,
    isSigningUp:false,
    isSigningIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,

    updateAuthUser: (user) => set({ authUser: user }),

    checkAuth:async()=>{
        try {
            const res = await axiosInstance.get("/auth/check")
            console.log(res.data)
            set({authUser:res.data})
        } catch (error) {
            console.log("error in checkAuth",error)
            set({authUser:null})
        }finally{
            set({isCheckingAuth:false})
        }
    },
    requestSignupOtp: async (email) => {
        try {
            const res = await axiosInstance.post("/auth/request-signup-otp", { email });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
            return false;
        }
    },
    signUp:async (data)=>{
        set({isSigningUp:true})
        try {
            const res = await axiosInstance.post("/auth/signup",data)
            set({authUser:res.data})
            toast.success("Account created succesfully")
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
            return false;
        } finally {
            set({isSigningUp:false})
        }
        return true;
    },
    signIn:async (data)=>{
        set({isSigningIn:true})
        try {
            const res = await axiosInstance.post("/auth/login",data)
            set({authUser:res.data})
            toast.success("logged In successfully")
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isSigningIn:false})
        }
    },
    logout:async()=>{
        try {
            await axiosInstance.post("/auth/logout")
            set({authUser:null})
            toast.success("Logged out successfully")
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
        }
    },
    forgotPassword: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/forgot-password", data);
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
            return false;
        }
    },
    resetPassword: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/reset-password", data);
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
            return false;
        }
    }
}))