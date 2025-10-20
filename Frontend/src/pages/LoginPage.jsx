import React from "react";
import GradientBlinds from "../component/GradientBlinds.jsx";
import { Loader2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../store/useAuthStore.js";
import toast from "react-hot-toast";

const LoginPage = () => {
  const { signIn, isSigningIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  const validateForm = useCallback(() => {
    if (!form.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(form.email))
      return toast.error("Invalid email format");
    if (!form.password.trim()) return toast.error("Password is required");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    return true;
  }, [form]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const success = validateForm();
      if (success === true) signIn(form);
    },
    [form, validateForm, signIn]
  );

  const layout = useMemo(() => {
    return (
      <div className="w-full h-screen bg-black backdrop-blur-lg relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-100 transition-opacity duration-1000">
          <GradientBlinds
            gradientColors={["#FF9FFC", "#5227FF"]}
            angle={0}
            noise={0.3}
            blindCount={12}
            blindMinWidth={50}
            spotlightRadius={0.5}
            spotlightSoftness={1}
            spotlightOpacity={1}
            mouseDampening={0.15}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="lighten"
          />
        </div>
      </div>
    );
  }, []);

  return (
    <div className="w-full backdrop-blur-lg h-screen bg-black relative">
      {layout}
      <div className="w-full flex h-screen absolute top-0 right-0 justify-center items-center">
        <div className="h-[60%] lg:w-[25%] w-[95%] flex flex-col justify-center gap-5 items-center rounded-2xl bg-light">
          <h1 className="text-dark text-5xl font-bold mb-5">Login</h1>
          <div className="border-2 border-dark w-[70%] rounded-full flex ">
            <Link
              to="/"
              className="w-[50%] text-xl font-bold text-light bg-dark rounded-l-full text-center p-2"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="w-[50%] text-xl font-bold text-dark bg-light text-center rounded-r-full p-2"
            >
              Sign Up
            </Link>
          </div>
          <form
            className="flex flex-col gap-3 items-center w-full"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2 w-[70%]">
              <h1 className="text-xl text-dark font-bold ml-4">Email</h1>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="text"
                className="rounded-full px-4 py-3 focus:bg-grayish bg-dark placeholder:text-light text-light placeholder:text-lg text-lg placeholder:font-medium font-medium"
                placeholder="Ex:-xyz@gmail.com"
              />
            </div>
            <div className="flex flex-col gap-2 w-[70%]">
              <h1 className="text-xl text-dark font-bold ml-4">Password</h1>
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                type="text"
                className="rounded-full px-4 py-3 focus:bg-grayish bg-dark placeholder:text-light text-light placeholder:text-lg text-lg placeholder:font-medium font-medium"
                placeholder="Type your password"
              />
            </div>
            <button
              disabled={isSigningIn}
              type="submit"
              className="w-[70%] my-4 rounded-lg bg-dark hover:bg-grayish transition-colors text-2xl text-light px-3 flex justify-center items-center ga[-2] py-4 font-bold"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Loading...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
