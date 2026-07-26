import React from "react";
import { Loader2, Code2, Sparkles, TerminalSquare } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../store/useAuthStore.js";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

import AuthVisual from "../components/AuthVisual.jsx";

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

  return (
    <div className="w-full min-h-screen bg-cream flex overflow-hidden selection:bg-greenDark selection:text-cream">
      <Helmet>
        <title>Log In to HatMind</title>
        <meta name="description" content="Log in to your HatMind account to access your conversation history, review code, and start chatting with your AI coding assistant." />
      </Helmet>
      {/* Left Panel - Branding & Immersive Visuals */}
      <AuthVisual />

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6 sm:p-12 relative">
        <Link to="/" className="absolute top-8 left-8 text-greenDark font-bold hover:text-greenLight transition-colors flex items-center gap-2">
          ← Back to Home
        </Link>
        
        <div className="w-full max-w-md flex flex-col gap-8 bg-cream/80 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-greenDark/10">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-greenDark tracking-tight">Login</h2>
            <p className="text-greenDark/70 font-medium">Enter your credentials to access your account.</p>
          </div>
          
          <div className="border border-greenDark/20 w-full rounded-xl flex overflow-hidden bg-white/50 p-1">
            <Link
              to="/login"
              className="w-1/2 text-sm uppercase tracking-wider font-bold text-cream bg-greenDark text-center py-3 rounded-lg shadow-sm transition-all"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="w-1/2 text-sm uppercase tracking-wider font-bold text-greenDark hover:bg-greenDark/5 text-center py-3 rounded-lg transition-all"
            >
              Sign Up
            </Link>
          </div>

          <form
            className="flex flex-col gap-5 w-full mt-2"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">Email Address</label>
              <div className="relative group">
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  className="w-full rounded-xl px-5 py-4 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all"
                  placeholder="hello@example.com"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">Password</label>
              <div className="relative group">
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  type="password"
                  className="w-full rounded-xl px-5 py-4 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs font-bold text-greenLight hover:text-greenDark transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>
            
            <button
              disabled={isSigningIn}
              type="submit"
              className="w-full mt-6 rounded-xl bg-greenLight hover:bg-greenDark disabled:bg-greenDark/50 transition-all duration-300 text-lg text-cream py-4 flex justify-center items-center gap-2 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-cream" />
                  <span>Authenticating...</span>
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
