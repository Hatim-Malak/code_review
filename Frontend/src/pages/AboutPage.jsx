import React, { useEffect, useState } from "react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import { useAuth } from "../store/useAuthStore.js";
import { Link } from "react-router-dom";
import { Code2, Zap, ShieldCheck, HeartHandshake, Bot, Github, ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

/* Same panel motif used on the homepage — reused here so the two pages
   read as one product rather than two different templates. */
const WindowPanel = ({ label, children }) => (
  <div className="rounded-2xl shadow-xl border border-greenDark/10 overflow-hidden bg-[#0d1117] text-left">
    <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-white/5">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
      </div>
      <div className="ml-2 text-xs text-gray-400 font-mono truncate">{label}</div>
    </div>
    <div className="px-6 py-6">{children}</div>
  </div>
);

const ValueColumn = ({ icon: Icon, title, description, first }) => (
  <div className={`px-0 md:px-10 py-8 md:py-0 ${first ? "" : "border-t md:border-t-0 md:border-l border-greenDark/10"}`}>
    <div className="w-12 h-12 rounded-xl bg-greenDark text-cream flex items-center justify-center mb-5">
      <Icon size={20} />
    </div>
    <h3 className="text-xl font-bold text-greenDark mb-2.5">{title}</h3>
    <p className="text-base text-gray-600 leading-relaxed font-medium">{description}</p>
  </div>
);

const AboutPage = () => {
  const { authUser, logout } = useAuth();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
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
    <div className="w-full min-h-screen bg-cream text-greenDark flex flex-col relative font-sans selection:bg-greenDark selection:text-cream overflow-hidden">
      <Helmet>
        <title>About Us | HatMind</title>
        <meta name="description" content="Learn about the mission and technology behind HatMind. We are building the future of automated code review to help developers write flawless code." />
      </Helmet>
      <CustomNavbar logo="./HatMind.jpg" items={navItems} />

      <main className={`transition-all duration-1000 transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

        {/* HERO */}
        <section className="pt-36 pb-24 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-greenDark/5 border border-greenDark/10 text-xs font-bold uppercase tracking-widest text-greenDark shadow-sm mb-8">
            <HeartHandshake size={14} className="text-greenLight" />
            Our Mission
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.08] text-greenDark mb-7">
            Code review shouldn't be<br />the bottleneck.
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium mb-14">
            HatMind is an AI pair programmer that automates pull request reviews, catches bugs and
            security issues early, and gives your team a chat interface for the entire codebase.
          </p>

          <div className="max-w-lg mx-auto">
            <WindowPanel label="ABOUT.md">
              <div className="font-mono text-sm leading-7 text-left">
                <div className="text-greenLight"># HatMind</div>
                <div className="text-gray-500 italic mt-1">&gt; AI code review, grounded in your actual codebase.</div>
                <div className="text-gray-300 mt-4">
                  Built to close the gap between shipping fast and<br />
                  reviewing carefully — so teams don't have to choose.
                </div>
              </div>
            </WindowPanel>
          </div>
        </section>

        {/* PULL QUOTE — our approach, stated plainly, no invented team or funding claims */}
        <section className="py-20 px-6 border-y border-greenDark/10 bg-white">
          <p className="max-w-3xl mx-auto text-center text-2xl md:text-4xl font-bold tracking-tight text-greenDark leading-snug">
            "We think review should move as fast as the code does —
            without losing the judgment a senior engineer brings to a diff."
          </p>
        </section>

        {/* WHY HATMIND — a divided triptych instead of boxed cards */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-greenDark mb-4">Why HatMind?</h2>
              <p className="text-lg text-gray-600 font-medium leading-relaxed">
                Built from the ground up to automate review workflows and give teams real codebase intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3">
              <ValueColumn
                first
                icon={Zap}
                title="Lightning-Fast Reviews"
                description="Instant AI reviews on every pull request — no waiting on a human to catch security risks or logic bugs."
              />
              <ValueColumn
                icon={ShieldCheck}
                title="Secure & Isolated"
                description="Static analysis and RAG-grounded LLM checks run in per-repository namespaces, so your code stays private."
              />
              <ValueColumn
                icon={Code2}
                title="Repo-Scoped Chat"
                description="Every chat thread is locked to a single repository, so answers stay accurate and project-specific."
              />
            </div>
          </div>
        </section>

        {/* CTA — boxed callout, matching the homepage treatment */}
        <section className="pb-28 px-6">
          <div className="max-w-6xl mx-auto rounded-[2.5rem] bg-greenDark px-8 md:px-16 py-20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-greenLight to-transparent mix-blend-overlay"></div>
            <div className="relative z-10 text-center flex flex-col items-center">
              <Bot size={40} className="text-greenLight mb-6" />
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-cream">See it review your own code.</h2>
              <p className="text-lg text-cream/80 font-medium mb-10 max-w-xl mx-auto leading-relaxed">
                Connect a repository and get your first automated review on the next pull request.
              </p>
              <Link
                to={authUser ? "/chat" : "/signup"}
                className="inline-flex items-center gap-3 px-10 py-5 bg-cream hover:bg-white text-greenDark rounded-xl font-bold text-lg transition-all shadow-2xl hover:-translate-y-1 group"
              >
                {authUser ? "Go to Dashboard" : "Get Started for Free"}
                <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER — matches the homepage footer */}
        <footer className="bg-cream pt-4 pb-10 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-20">
            <div className="flex flex-col gap-6 max-w-sm">
              <Link to="/" className="flex items-center gap-3">
                <img src="./HatMind.jpg" alt="Logo" className="h-10 w-auto rounded-lg shadow-sm" />
                <span className="text-2xl font-black tracking-tighter text-greenDark">HatMind</span>
              </Link>
              <p className="text-base text-gray-600 font-medium leading-relaxed">
                The AI pair programmer that deeply understands your architecture. Code reviews and codebase chat on autopilot.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 w-full md:w-auto">
              <div className="flex flex-col gap-5">
                <h4 className="font-bold text-greenDark uppercase tracking-wider text-sm">Product</h4>
                <Link to="/settings" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">GitHub App</Link>
                <Link to="/chat" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">AI Chatbot</Link>
                <Link to="/reviews" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">Review Dashboard</Link>
              </div>
              <div className="flex flex-col gap-5">
                <h4 className="font-bold text-greenDark uppercase tracking-wider text-sm">Resources</h4>
                <Link to="#" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">Documentation</Link>
                <Link to="#" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">Engineering Blog</Link>
                <Link to="#" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">API Reference</Link>
              </div>
              <div className="flex flex-col gap-5">
                <h4 className="font-bold text-greenDark uppercase tracking-wider text-sm">Company</h4>
                <Link to="/about" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">About Us</Link>
                <Link to="#" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">Privacy Policy</Link>
                <Link to="#" className="text-base text-gray-600 hover:text-greenDark font-medium transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-greenDark/10 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-500 font-medium">© {new Date().getFullYear()} HatMind Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 text-gray-400">
              <a href="#" className="hover:text-greenDark transition-colors"><Github size={24} /></a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default AboutPage;