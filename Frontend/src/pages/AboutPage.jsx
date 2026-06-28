import React, { useEffect, useState } from "react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import { useAuth } from "../store/useAuthStore.js";
import { Link } from "react-router-dom";
import { Code2, Zap, ShieldCheck, HeartHandshake, Bot, Terminal } from "lucide-react";

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

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-start gap-4 p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-greenDark/10 hover:border-greenLight/50 hover:bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(48,109,41,0.1)] transition-all duration-300 transform hover:-translate-y-1">
    <div className="w-14 h-14 rounded-2xl bg-greenDark text-cream flex justify-center items-center shadow-md">
      <Icon size={28} />
    </div>
    <h3 className="text-2xl font-bold text-greenDark tracking-tight">{title}</h3>
    <p className="text-greenDark/70 font-medium leading-relaxed">{description}</p>
  </div>
);

const AboutPage = () => {
  const { authUser, logout } = useAuth();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!document.getElementById("float-keyframes")) {
      const style = document.createElement("style");
      style.id = "float-keyframes";
      style.innerHTML = `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
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
          { label: "Logout", href: "#", onClick: logout }
        ]
      : [
          { label: "Login", href: "/login" },
          { label: "Sign Up", href: "/signup" },
        ]),
  ];

  return (
    <div className="w-full min-h-screen bg-cream flex flex-col relative selection:bg-greenDark selection:text-cream">
      <CustomNavbar logo="./ai.png" items={navItems} />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-20 overflow-hidden flex flex-col items-center border-b border-greenDark/10">
        <FloatingElement delay={0} duration={8} className="top-[20%] left-[10%] text-greenLight">
          <Bot size={120} />
        </FloatingElement>
        <FloatingElement delay={1.5} duration={10} className="bottom-[10%] right-[15%] text-greenDark">
          <Terminal size={80} />
        </FloatingElement>

        <div className={`max-w-4xl px-6 text-center flex flex-col items-center gap-6 relative z-10 transition-all duration-1000 transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-greenLight/10 text-greenDark font-bold text-sm uppercase tracking-widest border border-greenDark/20 mb-2">
            <HeartHandshake size={16} />
            Our Mission
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-greenDark tracking-tighter leading-tight drop-shadow-sm">
            Empowering Developers with AI
          </h1>
          <p className="text-xl md:text-2xl font-medium text-greenLight max-w-3xl leading-relaxed">
            At HatMind, we believe that writing great code shouldn't be a solitary struggle. 
            We're building the ultimate AI pair programmer to help you catch bugs early, optimize performance, and learn best practices in real-time.
          </p>
        </div>
      </div>

      {/* Core Values / Features */}
      <div className="w-full flex justify-center py-24 px-6 relative z-10">
        <div className="max-w-7xl w-full flex flex-col gap-16">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-black text-greenDark tracking-tight mb-4">Why HatMind?</h2>
            <p className="text-lg text-greenDark/70 font-medium max-w-2xl mx-auto">
              Our platform is designed from the ground up to be the most intuitive, fast, and helpful AI coding assistant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap}
              title="Lightning Fast"
              description="Get instant feedback on your Python scripts. No more waiting for human code reviews to find basic logical errors or syntax issues."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Secure & Reliable"
              description="We use state-of-the-art AI models to provide accurate, reliable reviews. Your code is processed securely."
            />
            <FeatureCard 
              icon={Code2}
              title="Learn as you Code"
              description="It's not just about fixing bugs; it's about learning. HatMind explains the 'why' behind every suggestion so you become a better developer."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-greenDark py-24 px-6 flex justify-center text-center">
        <div className="max-w-3xl flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-5xl font-black text-cream tracking-tight">Ready to revolutionize your coding?</h2>
          <p className="text-xl text-greenLight font-medium max-w-2xl">
            Join thousands of developers who are already writing cleaner, faster code with HatMind.
          </p>
          <Link
            to={authUser ? "/chat" : "/signup"}
            className="mt-4 px-10 py-5 bg-cream text-greenDark rounded-full text-xl font-black hover:bg-greenLight hover:text-cream hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            {authUser ? "Go to Dashboard" : "Get Started for Free"}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-greenDark/10 flex justify-center text-greenDark/50 font-medium">
        <p>© {new Date().getFullYear()} HatMind. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
