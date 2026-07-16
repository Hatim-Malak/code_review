import React, { useEffect, useState } from "react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import TextType from "../components/TextType.jsx";
import { Link } from "react-router-dom";
import { ExternalLink, Code2, Sparkles, TerminalSquare, Activity, CheckCircle, XCircle, RefreshCw, Box, GitPullRequest, ShieldAlert } from "lucide-react";
import { useAuth } from "../store/useAuthStore.js";
import { axiosInstance } from "../lib/axios.js";
import { Helmet } from "react-helmet-async";

const FloatingElement = ({ children, delay, duration, className }) => (
  <div
    className={`absolute opacity-20 pointer-events-none ${className}`}
    style={{
      animation: `float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    {children}
  </div>
);

const ActivityIcon = ({ type }) => {
  switch (type) {
    case 'review_started': return <RefreshCw className="text-blue-500 animate-spin-slow" size={18} />;
    case 'review_completed': return <CheckCircle className="text-orange-500" size={18} />;
    case 'review_failed': return <XCircle className="text-red-500" size={18} />;
    case 'reindexed': return <Box className="text-purple-500" size={18} />;
    case 'pr_merged_clean': return <CheckCircle className="text-green-500" size={18} />;
    default: return <Activity className="text-gray-500" size={18} />;
  }
};

const DashboardView = () => {
  const [data, setData] = useState({ activities: [], stats: { totalRepos: 0, totalReviews: 0, totalFindings: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await axiosInstance.get("/activity");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load activity", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-24 px-6 relative z-10 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Stats */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <h2 className="text-2xl font-black text-greenDark mb-2 flex items-center gap-2">
            <Activity className="text-greenLight" /> Overview
          </h2>
          <div className="bg-white/80 backdrop-blur border border-greenDark/10 p-6 rounded-2xl shadow-sm hover:shadow transition flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <Box size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-greenDark/50 uppercase tracking-wider">Repositories</p>
              <p className="text-3xl font-black text-greenDark">{data.stats.totalRepos}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur border border-greenDark/10 p-6 rounded-2xl shadow-sm hover:shadow transition flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
              <GitPullRequest size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-greenDark/50 uppercase tracking-wider">PRs Reviewed</p>
              <p className="text-3xl font-black text-greenDark">{data.stats.totalReviews}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur border border-greenDark/10 p-6 rounded-2xl shadow-sm hover:shadow transition flex items-center gap-4">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
              <ShieldAlert size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-greenDark/50 uppercase tracking-wider">Total Findings</p>
              <p className="text-3xl font-black text-greenDark">{data.stats.totalFindings}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Feed */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <h2 className="text-2xl font-black text-greenDark mb-2 flex items-center gap-2">
            <Sparkles className="text-greenLight" /> Activity Feed
          </h2>
          <div className="bg-white/60 backdrop-blur border border-greenDark/10 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-greenDark/50 animate-pulse">
                Loading activity...
              </div>
            ) : data.activities.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-greenDark/50">
                No recent activity. Install the app to get started!
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-greenDark/5 max-h-[600px] overflow-y-auto">
                {data.activities.map(act => (
                  <div key={act._id} className="p-4 hover:bg-white/50 transition-colors flex gap-4 items-start">
                    <div className="mt-1 p-2 bg-white rounded-full border border-greenDark/10 shadow-sm">
                      <ActivityIcon type={act.type} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-greenDark">{act.repoId?.owner}/{act.repoId?.name}</span>
                        {act.prNumber && (
                          <span className="px-2 py-0.5 bg-greenLight/10 text-greenDark/70 text-xs font-bold rounded-md">
                            PR #{act.prNumber}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-greenDark/40">{timeAgo(act.createdAt)}</span>
                      </div>
                      <p className="text-sm text-greenDark/80 mt-1 font-medium">{act.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const { authUser, logout } = useAuth();

  useEffect(() => {
    // Inject keyframes for floating animation if not present
    if (!document.getElementById("float-keyframes")) {
      const style = document.createElement("style");
      style.id = "float-keyframes";
      style.innerHTML = `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-reverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(30px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    ...(authUser
      ? [
          { label: "Chat", href: "/chat" },
          { label: "Reviews", href: "/reviews" },
          { label: "Logout", href: "#", onClick: logout },
        ]
      : [
          { label: "Login", href: "/login" },
          { label: "Sign Up", href: "/signup" },
        ]),
  ];

  return (
    <div className="w-full min-h-screen bg-cream relative flex flex-col overflow-hidden selection:bg-greenDark selection:text-cream">
      <Helmet>
        <title>HatMind - AI Powered Code Review & Optimization</title>
        <meta name="description" content="HatMind is your intelligent AI pair programmer. Get instant code reviews, optimize performance, and find bugs in your Python scripts effortlessly." />
      </Helmet>
      {/* Immersive Floating Background Elements */}
      <FloatingElement delay={0} duration={8} className="top-[20%] left-[10%] text-greenLight">
        <Code2 size={120} />
      </FloatingElement>
      <FloatingElement delay={2} duration={12} className="top-[60%] left-[5%] text-greenDark">
        <TerminalSquare size={80} />
      </FloatingElement>
      <FloatingElement delay={1} duration={10} className="top-[15%] right-[15%] text-greenDark">
        <Sparkles size={100} />
      </FloatingElement>
      <FloatingElement delay={3} duration={14} className="top-[70%] right-[10%] text-greenLight">
        <div className="font-mono text-9xl font-bold">{"{}"}</div>
      </FloatingElement>

      <CustomNavbar logo="./HatMind.jpg" items={navItems} />
      
      {authUser ? (
        <DashboardView />
      ) : (
        <div className={`flex-1 w-full flex flex-col justify-center items-center px-4 relative z-10 transition-all duration-1000 transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="max-w-5xl w-full flex flex-col justify-center gap-10 items-center mt-20">
            
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-greenDark/10 text-greenDark font-bold text-sm uppercase tracking-widest border border-greenDark/20 mb-4 animate-pulse">
                <Sparkles size={16} />
                Your AI Pair Programmer
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black text-greenDark tracking-tighter leading-tight drop-shadow-sm">
                HatMind
              </h1>
              
              <p className="text-xl md:text-2xl font-medium text-greenLight max-w-2xl mt-4 leading-relaxed">
                Drop in your Python code, get instant, actionable reviews to write cleaner, faster, and better code.
              </p>
            </div>

            <div className="h-24 flex items-center justify-center">
              <TextType
                className="text-3xl lg:text-5xl font-bold text-center text-greenDark bg-greenLight/10 px-6 py-4 rounded-2xl border border-greenDark/10"
                text={[
                  "Catch bugs before they ship.",
                  "Optimize performance instantly.",
                  "Enforce best practices effortlessly.",
                  "Master Python with every review.",
                ]}
                typingSpeed={75}
                pauseDuration={2000}
                showCursor={true}
                cursorCharacter="|"
              />
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-center items-center gap-6 mt-8">
              <Link
                to="/chat"
                className="group relative px-8 py-5 bg-greenDark text-cream rounded-full text-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-greenLight transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
                <span className="relative z-10">Start Reviewing Code</span>
                <Code2 className="relative z-10 group-hover:rotate-12 transition-transform duration-300" size={24} />
              </Link>
              <Link
                to="/about"
                className="px-8 py-5 flex gap-2 justify-center items-center rounded-full bg-cream border-2 border-greenDark text-greenDark text-xl font-bold hover:bg-greenDark/5 transition-all duration-300 transform hover:-translate-y-2"
              >
                Learn More <ExternalLink size={24} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
