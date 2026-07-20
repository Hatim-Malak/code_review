import React, { useEffect, useState } from "react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import TextType from "../components/TextType.jsx";
import { Link } from "react-router-dom";
import { ExternalLink, Code2, Sparkles, TerminalSquare } from "lucide-react";
import { useAuth } from "../store/useAuthStore.js";
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
          { label: "Settings", href: "/settings" },
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
    </div>
  );
};

export default HomePage;
