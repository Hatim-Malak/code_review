import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../store/useAuthStore.js";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, Rocket, Zap } from "lucide-react";

import AuthVisual from "../components/AuthVisual.jsx";

const SignUpPage = () => {
  const { signUp, isSigningUp} = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const validateForm = useCallback(() => {
    if (!form.fullName.trim()) return toast.error("Full name is required");
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
      if (success === true) signUp(form);
    },
    [form, validateForm, signUp]
  );

  return (
    <div className="w-full min-h-screen bg-cream flex flex-row-reverse overflow-hidden selection:bg-greenDark selection:text-cream">
      {/* Right Panel - Branding & Immersive Visuals */}
      <AuthVisual />

      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6 sm:p-12 relative">
        <Link to="/" className="absolute top-8 left-8 text-greenDark font-bold hover:text-greenLight transition-colors flex items-center gap-2">
          ← Back to Home
        </Link>

        <div className="w-full max-w-md flex flex-col gap-6 bg-cream/80 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-greenDark/10">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-greenDark tracking-tight">Create Account</h2>
            <p className="text-greenDark/70 font-medium">Sign up to get started with AI code reviews.</p>
          </div>

          <div className="border border-greenDark/20 w-full rounded-xl flex overflow-hidden bg-white/50 p-1">
            <Link
              to="/login"
              className="w-1/2 text-sm uppercase tracking-wider font-bold text-greenDark hover:bg-greenDark/5 text-center py-3 rounded-lg transition-all"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="w-1/2 text-sm uppercase tracking-wider font-bold text-cream bg-greenDark text-center py-3 rounded-lg shadow-sm transition-all"
            >
              Sign Up
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-full mt-2"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">Full Name</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                type="text"
                className="w-full rounded-xl px-5 py-3 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">Email Address</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                className="w-full rounded-xl px-5 py-3 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all"
                placeholder="hello@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">Password</label>
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                type="password"
                className="w-full rounded-xl px-5 py-3 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all"
                placeholder="Create a strong password"
              />
            </div>

            <button
              disabled={isSigningUp}
              type="submit"
              className="w-full mt-4 rounded-xl bg-greenLight hover:bg-greenDark disabled:bg-greenDark/50 transition-all duration-300 text-lg text-cream py-4 flex justify-center items-center gap-2 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-cream" />
                  <span>Creating Account...</span>
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

export default SignUpPage;
