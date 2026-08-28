import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../store/useAuthStore.js";
import toast from "react-hot-toast";
import { Loader2, KeyRound } from "lucide-react";
import { Helmet } from "react-helmet-async";

import AuthVisual from "../components/AuthVisual.jsx";

const SignUpPage = () => {
  const { signUp, requestSignupOtp, isSigningUp } = useAuth();
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verify OTP
  const [form, setForm] = useState({ fullName: "", email: "", password: "", otp: "" });
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const validateStep1 = useCallback(() => {
    const cleanFullName = form.fullName.trim();
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPassword = form.password.trim();

    if (!cleanFullName) return toast.error("Full name is required");
    if (!cleanEmail) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) return toast.error("Invalid email format");
    if (!cleanPassword) return toast.error("Password is required");
    if (cleanPassword.length < 6) return toast.error("Password must be at least 6 characters");
    return true;
  }, [form]);

  const handleRequestOtp = useCallback(async (e) => {
    e.preventDefault();
    if (validateStep1() !== true) return;
    
    setIsRequestingOtp(true);
    const cleanEmail = form.email.trim().toLowerCase();
    const success = await requestSignupOtp(cleanEmail);
    setIsRequestingOtp(false);
    
    if (success) {
      setStep(2);
      setResendCooldown(30);
    }
  }, [form.email, requestSignupOtp, validateStep1]);

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || isResendingOtp) return;
    const cleanEmail = form.email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Email address is missing");
      setStep(1);
      return;
    }

    setIsResendingOtp(true);
    const success = await requestSignupOtp(cleanEmail);
    setIsResendingOtp(false);

    if (success) {
      setResendCooldown(30);
    }
  }, [form.email, resendCooldown, isResendingOtp, requestSignupOtp]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleFinalSignup = useCallback(async (e) => {
    e.preventDefault();
    const cleanOtp = form.otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) return toast.error("Please enter a valid 6-digit OTP");
    
    await signUp({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      otp: cleanOtp,
    });
  }, [form, signUp]);

  return (
    <div className="w-full min-h-screen bg-cream flex flex-row-reverse overflow-hidden selection:bg-greenDark selection:text-cream">
      <Helmet>
        <title>Sign Up | Join HatMind</title>
        <meta name="description" content="Create a free HatMind account today and supercharge your development workflow with AI-powered code reviews." />
      </Helmet>
      
      {/* Right Panel - Branding & Immersive Visuals */}
      <AuthVisual />

      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6 sm:p-12 relative">
        <Link to="/" className="absolute top-8 left-8 text-greenDark font-bold hover:text-greenLight transition-colors flex items-center gap-2">
          ← Back to Home
        </Link>

        <div className="w-full max-w-md flex flex-col gap-6 bg-cream/80 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-greenDark/10">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-greenDark tracking-tight">
              {step === 1 ? "Create Account" : "Verify Email"}
            </h2>
            <p className="text-greenDark/70 font-medium">
              {step === 1 ? "Sign up to get started with AI code reviews." : `We sent a code to ${form.email.trim().toLowerCase()}`}
            </p>
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

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4 w-full mt-2">
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
                disabled={isRequestingOtp}
                type="submit"
                className="w-full mt-4 rounded-xl bg-greenLight hover:bg-greenDark disabled:bg-greenDark/50 transition-all duration-300 text-lg text-cream py-4 flex justify-center items-center gap-2 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-cream" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinalSignup} className="flex flex-col gap-4 w-full mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">6-Digit OTP</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-greenDark/40 group-focus-within:text-greenLight transition-colors" />
                  </div>
                  <input
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value })}
                    type="text"
                    maxLength={6}
                    className="w-full rounded-xl pl-12 pr-5 py-4 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all tracking-widest text-center text-lg"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                disabled={isSigningUp}
                type="submit"
                className="w-full mt-4 rounded-xl bg-greenLight hover:bg-greenDark disabled:bg-greenDark/50 transition-all duration-300 text-lg text-cream py-4 flex justify-center items-center gap-2 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSigningUp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-cream" />
                    <span>Completing Signup...</span>
                  </>
                ) : (
                  "Complete Signup"
                )}
              </button>

              <div className="flex flex-col items-center gap-2 mt-4 text-center">
                <p className="text-sm text-greenDark/70 font-medium">
                  Didn't receive the code?{" "}
                  <button 
                    type="button"
                    disabled={isResendingOtp || resendCooldown > 0}
                    onClick={handleResendOtp}
                    className="text-greenLight hover:text-greenDark font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isResendingOtp ? "Sending..." : resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                  </button>
                </p>
                
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-greenDark/60 hover:text-greenDark underline transition-colors cursor-pointer"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
