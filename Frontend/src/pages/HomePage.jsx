import React, { useEffect, useState } from "react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../store/useAuthStore.js";
import { Helmet } from "react-helmet-async";
import { 
  Github, GitPullRequest, MessageSquare, Code2, 
  Sparkles, Zap, ShieldCheck, LayoutDashboard,
  CheckCircle2, Box, ArrowRight, Activity, PlayCircle, ChevronRight
} from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white border border-greenDark/10 hover:border-greenLight/50 transition-all group shadow-sm hover:shadow-xl">
    <div className="w-14 h-14 rounded-2xl bg-greenDark text-cream flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300">
      <Icon size={24} />
    </div>
    <h3 className="text-2xl font-black text-greenDark tracking-tight mt-2">{title}</h3>
    <p className="text-base text-gray-600 leading-relaxed font-medium">{description}</p>
  </div>
);

const DetailedFeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-5 p-8 rounded-3xl bg-white/60 border border-greenDark/10 hover:bg-white transition-all backdrop-blur-sm shadow-sm hover:shadow-lg group">
    <div className="w-12 h-12 rounded-xl bg-greenDark/5 flex items-center justify-center text-greenDark shrink-0 group-hover:bg-greenDark group-hover:text-cream transition-colors duration-300">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-greenDark mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);

const HomePage = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { authUser, logout } = useAuth();

  const slides = [
    "./dashboard-mockup.png",
    "./pr-review-mockup.png",
    "./arch-graph-mockup.png"
  ];

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    
    // Carousel auto-play
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(slideTimer);
    };
  }, [slides.length]);

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
    <div className="w-full min-h-screen bg-cream text-greenDark relative font-sans selection:bg-greenDark selection:text-cream overflow-hidden">
      <Helmet>
        <title>HatMind - AI Powered GitHub Code Reviews</title>
        <meta name="description" content="Automate your pull requests with HatMind. AI-powered code reviews, instant bug detection, and deep codebase chat." />
      </Helmet>

      <CustomNavbar logo="./HatMind.jpg" items={navItems} />
      
      <main className={`transition-all duration-1000 transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center gap-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-greenDark/5 border border-greenDark/10 text-xs font-bold uppercase tracking-widest text-greenDark shadow-sm">
            <Sparkles size={14} className="text-greenLight" />
            The Next Generation of Code Review
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] text-greenDark max-w-5xl">
            Ship perfect code. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-greenDark to-greenLight">
              Without the bottleneck.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl leading-relaxed font-medium">
            HatMind instantly reviews every pull request and provides deep, context-aware insights into your entire repository architecture.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
            <Link to={authUser ? "/settings" : "/signup"} className="w-full sm:w-auto px-10 py-5 bg-greenDark hover:bg-greenDark/90 text-cream rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <Link to="/chat" className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-gray-50 border-2 border-greenDark/10 rounded-xl font-bold text-lg text-greenDark transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
              Try Interactive Demo <PlayCircle size={20} />
            </Link>
          </div>

          {/* Hero Carousel */}
          <div className="mt-16 w-full max-w-6xl relative z-10 group perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-b from-greenLight/20 to-transparent blur-3xl -z-10 rounded-full transform -translate-y-10 opacity-50"></div>
            
            <div className="relative w-full aspect-[16/9] rounded-3xl shadow-2xl border border-greenDark/10 overflow-hidden bg-black/5">
              {slides.map((slide, index) => (
                <img 
                  key={index}
                  src={slide} 
                  alt={`Mockup Slide ${index + 1}`} 
                  className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                  }`}
                />
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "bg-greenDark w-8" : "bg-greenDark/20 hover:bg-greenDark/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
        </section>

        {/* LOGO CLOUD / SOCIAL PROOF */}
        <section className="py-12 border-y border-greenDark/10 bg-white/50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-bold tracking-widest uppercase text-gray-500 mb-8">Trusted by elite engineering teams</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Dummy logos using typography for professional look */}
              <div className="text-2xl font-black tracking-tighter">AcmeCorp</div>
              <div className="text-2xl font-bold tracking-tight font-serif italic">GlobalTech</div>
              <div className="text-2xl font-bold uppercase tracking-widest">NEXUS</div>
              <div className="text-2xl font-black tracking-tighter flex items-center gap-1"><Zap size={24}/> Spark</div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-greenDark mb-6">Built for velocity and scale</h2>
              <p className="text-lg text-gray-600 font-medium leading-relaxed">
                We've combined advanced static analysis with LLMs to create a system that deeply understands your architecture.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FeatureCard 
                icon={GitPullRequest} 
                title="Automated PR Reviews" 
                description="Instantly reviews every commit, catching bugs, security flaws, and style violations before a human ever has to look."
              />
              <FeatureCard 
                icon={MessageSquare} 
                title="Codebase AI Chatbot" 
                description="Stop searching through endless files. Ask our chatbot complex questions about your repository and get accurate, context-aware answers."
              />
              <FeatureCard 
                icon={ShieldCheck} 
                title="Enterprise-Grade Security" 
                description="Proactively identifies vulnerable dependencies, hardcoded secrets, and unsafe execution patterns in real-time."
              />
              <FeatureCard 
                icon={Github} 
                title="Native GitHub Integration" 
                description="No clunky CI pipelines to configure. Install the HatMind GitHub App and get automated reviews on your repositories instantly."
              />
            </div>
          </div>
        </section>

        {/* DETAILED PLATFORM FEATURES */}
        <section className="py-32 px-6 bg-white border-t border-greenDark/5">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-sm font-bold text-greenLight tracking-widest uppercase mb-4">The Platform</h2>
              <h3 className="text-4xl md:text-5xl font-black tracking-tight text-greenDark">A complete suite for engineering excellence.</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <DetailedFeatureCard 
                icon={CheckCircle2} title="Actionable Feedback" 
                description="No more vague complaints. Get precise line-by-line comments with suggested code fixes you can commit immediately."
              />
              <DetailedFeatureCard 
                icon={Box} title="Semantic Architecture Understanding" 
                description="We index your repository using advanced Retrieval-Augmented Generation (RAG) to understand how your services connect."
              />
              <DetailedFeatureCard 
                icon={Code2} title="Style Standard Enforcement" 
                description="Automatically enforce your team's specific coding guidelines and best practices without manual nitpicking."
              />
              <DetailedFeatureCard 
                icon={LayoutDashboard} title="Custom Review Thresholds" 
                description="Configure exactly what HatMind should care about. Silence minor styling issues and focus purely on logic if preferred."
              />
              <DetailedFeatureCard 
                icon={Activity} title="Real-Time Analytics" 
                description="Track how fast your team is merging PRs and monitor the reduction in post-deployment bugs over time."
              />
              <DetailedFeatureCard 
                icon={Zap} title="Sub-Second Latency" 
                description="Our optimized engine processes standard pull requests in seconds, never blocking your deployment pipelines."
              />
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-40 px-6 relative overflow-hidden bg-greenDark">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-greenLight to-transparent mix-blend-overlay"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-cream">Automate your engineering standards.</h2>
            <p className="text-xl text-cream/80 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the elite engineering teams who have eliminated their code review bottlenecks and ship with absolute confidence.
            </p>
            <Link to={authUser ? "/settings" : "/signup"} className="inline-flex items-center gap-3 px-12 py-6 bg-cream hover:bg-white text-greenDark rounded-xl font-bold text-xl transition-all shadow-2xl hover:-translate-y-1 group">
              Start Free Trial <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-cream pt-20 pb-10 px-6">
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

export default HomePage;
