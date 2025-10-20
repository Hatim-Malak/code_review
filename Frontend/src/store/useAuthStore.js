import { axiosInstance } from "../lib/axios.js"
import {toast} from "react-hot-toast"
import {create} from "zustand"

export const useAuth = create((set,get)=>({
    authUser:null,
    isSigningUp:false,
    isSigningIn:false,
    isCheckingAuth:true,

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
    signUp:async (data)=>{
        set({isSigningUp:true})
        try {
            const res = await axiosInstance.post("/auth/signup",data)
            set({authUser:res.data})
            toast.success("Account created succesfully")
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isSigningUp:false})
        }
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
            toast.error(error.response.data.message)
        }
    }
}))