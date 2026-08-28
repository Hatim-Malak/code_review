import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/useAuthStore";
import { Mail, ArrowLeft, Loader2, KeyRound, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP + New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If navigated here with email state
    if (location.state?.email) {
      setEmail(location.state.email.trim().toLowerCase());
      setStep(2);
      setResendCooldown(30);
    }
  }, [location.state]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      return toast.error("Please enter a valid email address");
    }

    setIsLoading(true);
    const success = await forgotPassword({ email: cleanEmail });
    setIsLoading(false);
    if (success) {
      setStep(2);
      setResendCooldown(30);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isResending) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Please enter your email address");
      setStep(1);
      return;
    }

    setIsResending(true);
    const success = await forgotPassword({ email: cleanEmail });
    setIsResending(false);
    if (success) {
      setResendCooldown(30);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    if (!cleanEmail) return toast.error("Email is required");
    if (!cleanOtp || cleanOtp.length < 6) return toast.error("Please enter a valid 6-digit OTP");
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    
    setIsLoading(true);
    const success = await resetPassword({ email: cleanEmail, otp: cleanOtp, newPassword });
    setIsLoading(false);
    
    if (success) {
      navigate("/login");
    }
  };

  return (
    <div className="w-full min-h-screen bg-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-greenDark selection:text-cream">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-greenDark tracking-tight">
          {step === 1 ? "Forgot your password?" : "Reset Password"}
        </h2>
        <p className="mt-2 text-center text-sm text-greenDark/70 font-medium">
          {step === 1 
            ? "Enter your email address and we'll send you a One-Time Password (OTP) to reset it."
            : `Enter the 6-digit OTP sent to ${email.trim().toLowerCase()} and your new password.`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/50 backdrop-blur-sm py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-greenDark/10">
          
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRequestOTP}>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-greenDark/40 group-focus-within:text-greenLight transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-5 py-4 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-cream bg-greenLight hover:bg-greenDark focus:outline-none focus:ring-4 focus:ring-greenLight/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send OTP"}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-greenDark/40" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded-xl pl-12 pr-5 py-4 border-2 border-greenDark/10 bg-gray-50/50 outline-none text-greenDark/50 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="otp" className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">
                  6-Digit OTP
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-greenDark/40 group-focus-within:text-greenLight transition-colors" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-5 py-4 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all tracking-widest text-center text-lg"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="newPassword" className="text-xs text-greenDark font-bold uppercase tracking-widest pl-2">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-greenDark/40 group-focus-within:text-greenLight transition-colors" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-5 py-4 border-2 border-greenDark/10 bg-white/50 focus:bg-white focus:border-greenLight focus:ring-4 focus:ring-greenLight/10 outline-none placeholder:text-greenDark/30 text-greenDark font-medium transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-cream bg-greenLight hover:bg-greenDark focus:outline-none focus:ring-4 focus:ring-greenLight/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 mt-4 text-center">
                <p className="text-sm text-greenDark/70 font-medium">
                  Didn't receive the code?{" "}
                  <button 
                    type="button"
                    disabled={isResending || resendCooldown > 0}
                    onClick={handleResendOTP}
                    className="text-greenLight hover:text-greenDark font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isResending ? "Sending..." : resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
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

          <div className="mt-8 border-t border-greenDark/10 pt-6">
            <Link to="/login" className="flex items-center justify-center text-sm font-bold text-greenDark hover:text-greenLight transition-colors uppercase tracking-wider">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
