import React, { useEffect, useState } from "react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../store/useAuthStore.js";
import { Helmet } from "react-helmet-async";
import { 
  Github, GitPullRequest, MessageSquare, Code2, 
  Sparkles, Zap, ShieldCheck, LayoutDashboard,
  CheckCircle2, Box, ArrowRight, Activity, PlayCircle
} from "lucide-react";

const avatars = [
  "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  "https://i.pravatar.cc/150?u=a04258114e29026702d",
  "https://i.pravatar.cc/150?u=a048581f4e29026701d",
];

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white/60 border border-greenDark/10 hover:bg-white transition-colors backdrop-blur-sm group shadow-sm">
    <div className="w-12 h-12 rounded-xl bg-greenDark/10 flex items-center justify-center text-greenDark group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-greenDark mt-2">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const DetailedFeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4 p-6 rounded-2xl bg-white/60 border border-greenDark/10 hover:bg-white transition-colors backdrop-blur-sm shadow-sm">
    <div className="w-12 h-12 rounded-xl bg-greenDark/10 flex items-center justify-center text-greenDark shrink-0">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-greenDark mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

const HomePage = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const { authUser, logout } = useAuth();

  useEffect(() => {
    // Ensure keyframes for floating animation exist
    if (!document.getElementById("float-keyframes")) {
      const style = document.createElement("style");
      style.id = "float-keyframes";
      style.innerHTML = `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-reverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
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
    <div className="w-full min-h-screen bg-cream text-greenDark relative font-sans selection:bg-greenDark selection:text-cream overflow-hidden">
      <Helmet>
        <title>HatMind - AI Powered GitHub Code Reviews</title>
        <meta name="description" content="Automate your pull requests with HatMind. AI-powered code reviews, instant bug detection, and deep codebase chat." />
      </Helmet>

      <CustomNavbar logo="./HatMind.jpg" items={navItems} />
      
      <main className={`transition-all duration-1000 transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 min-h-[90vh]">
          {/* Left: Copy */}
          <div className="flex-1 flex flex-col items-start gap-6 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-greenDark/10 border border-greenDark/20 text-xs font-bold uppercase tracking-widest text-greenDark shadow-sm">
              <span className="w-2 h-2 rounded-full bg-greenDark animate-pulse"></span>
              Automated Code Review System
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-tight drop-shadow-sm text-greenDark">
              The System Behind <br/> Perfect Code. <br/>
              <span className="text-greenLight">
                On Repeat.
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed font-medium">
              Automated AI code reviews directly on your GitHub pull requests. Plus a powerful AI chatbot for deep codebase exploration.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
              <Link to="/settings" className="w-full sm:w-auto px-8 py-4 bg-greenDark hover:bg-greenDark/90 text-cream rounded-full font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                Connect GitHub <ArrowRight size={20} />
              </Link>
              <Link to="/chat" className="w-full sm:w-auto px-8 py-4 bg-white/60 hover:bg-white border border-greenDark/20 rounded-full font-bold text-lg text-greenDark transition-all shadow-sm flex items-center justify-center gap-2">
                Try Chatbot <PlayCircle size={20} />
              </Link>
            </div>
            {/* Social Proof */}
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-3">
                {avatars.map((url, i) => (
                  <img key={i} src={url} alt="User" className="w-10 h-10 rounded-full border-2 border-cream shadow-sm" />
                ))}
              </div>
              <p className="text-sm text-gray-600 font-medium">Join <strong className="text-greenDark">1,000+ developers</strong> shipping faster.</p>
            </div>
          </div>

          {/* Right: Graphic */}
          <div className="flex-1 relative w-full aspect-square max-w-[600px] z-10 hidden lg:block">
            {/* Mock PR Interface Box */}
            <div className="absolute inset-0 bg-cream/80 backdrop-blur-sm border border-greenDark/20 rounded-2xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)] flex flex-col overflow-hidden">
              
              {/* Browser/Header Bar */}
              <div className="h-10 bg-greenDark/5 border-b border-greenDark/10 flex items-center px-4 shrink-0">
                <div className="flex items-center gap-2 text-xs text-greenDark/70 font-medium">
                  <Github size={14} /> <span>HatMind-AI / core-engine / Pull Request #42</span>
                </div>
              </div>

              <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
                
                {/* PR Header */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-greenDark mb-2 leading-tight">Refactor authentication flow & fix connection leak</h3>
                  <div className="flex items-center gap-3 text-sm text-greenDark/70">
                    <span className="bg-greenLight/20 text-greenDark px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                      <GitPullRequest size={12} /> Open
                    </span>
                    <span><strong className="text-greenDark">alex-dev</strong> wants to merge 3 commits into <code className="bg-greenDark/10 px-1.5 py-0.5 rounded text-greenDark text-xs font-mono">main</code></span>
                  </div>
                </div>

                {/* PR Timeline / Diff 1 */}
                <div className="border border-greenDark/20 rounded-lg mb-6 overflow-hidden shadow-sm">
                  <div className="bg-greenDark/5 px-4 py-2.5 border-b border-greenDark/10 flex justify-between items-center text-xs text-greenDark/80 font-mono font-bold">
                    <span>src/middleware/auth.js</span>
                  </div>
                  <div className="font-mono text-[11px] leading-relaxed text-greenDark bg-cream">
                    <div className="flex">
                      <div className="w-8 shrink-0 text-right pr-2 text-greenDark/40 bg-greenDark/5 border-r border-greenDark/10 py-0.5">14</div>
                      <div className="pl-4 py-0.5 w-full whitespace-pre">const token = req.headers.authorization;</div>
                    </div>
                    <div className="flex bg-red-500/5">
                      <div className="w-8 shrink-0 text-right pr-2 text-red-400 bg-red-500/10 border-r border-red-500/20 py-0.5">15</div>
                      <div className="pl-4 py-0.5 w-full text-red-600 bg-red-500/10 whitespace-pre">- console.log("Received token:", token);</div>
                    </div>
                    <div className="flex bg-greenLight/10">
                      <div className="w-8 shrink-0 text-right pr-2 text-greenDark bg-greenLight/20 border-r border-greenLight/30 py-0.5">15</div>
                      <div className="pl-4 py-0.5 w-full text-greenDark bg-greenLight/10 whitespace-pre">+ logger.debug("Auth token received (masked)");</div>
                    </div>
                  </div>
                  
                  {/* Inline Comment */}
                  <div className="border-t border-greenDark/10 bg-greenDark/5 p-4 pl-12 relative">
                    {/* Thread connector line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-greenDark/20"></div>
                    
                    <div className="bg-cream border border-greenDark/20 rounded-xl p-3.5 shadow-sm relative z-10 transition-shadow hover:shadow-md">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-greenDark text-cream flex items-center justify-center shadow-sm">
                            <Sparkles size={12} />
                          </div>
                          <span className="text-[13px] font-bold text-greenDark">HatMind AI</span>
                          <span className="bg-greenLight/20 text-greenDark text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-greenLight/30">Automated</span>
                        </div>
                        <span className="text-[10px] text-greenDark/50">now</span>
                      </div>
                      <p className="text-[13px] text-greenDark/90 leading-relaxed">
                        <strong className="text-greenDark">Security Approval:</strong> Good job removing the raw authorization token log. The masked logger properly adheres to security guidelines.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diff 2 */}
                <div className="border border-greenDark/20 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-greenDark/5 px-4 py-2.5 border-b border-greenDark/10 flex justify-between items-center text-xs text-greenDark/80 font-mono font-bold">
                    <span>src/db/pool.js</span>
                  </div>
                  <div className="font-mono text-[11px] leading-relaxed text-greenDark bg-cream">
                    <div className="flex">
                      <div className="w-8 shrink-0 text-right pr-2 text-greenDark/40 bg-greenDark/5 border-r border-greenDark/10 py-0.5">42</div>
                      <div className="pl-4 py-0.5 w-full whitespace-pre">const client = await pool.connect();</div>
                    </div>
                    <div className="flex bg-greenLight/10">
                      <div className="w-8 shrink-0 text-right pr-2 text-greenDark bg-greenLight/20 border-r border-greenLight/30 py-0.5">43</div>
                      <div className="pl-4 py-0.5 w-full text-greenDark bg-greenLight/10 whitespace-pre">+ try &#123;</div>
                    </div>
                    <div className="flex bg-greenLight/10">
                      <div className="w-8 shrink-0 text-right pr-2 text-greenDark bg-greenLight/20 border-r border-greenLight/30 py-0.5">44</div>
                      <div className="pl-4 py-0.5 w-full text-greenDark bg-greenLight/10 whitespace-pre">+   await client.query('BEGIN');</div>
                    </div>
                  </div>
                  
                  {/* Inline Comment 2 */}
                  <div className="border-t border-greenDark/10 bg-greenDark/5 p-4 pl-12 relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-greenDark/20"></div>
                    <div className="bg-cream border border-greenDark/20 rounded-xl p-3.5 shadow-sm relative z-10 transition-shadow hover:shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-greenDark text-cream flex items-center justify-center shadow-sm">
                          <Sparkles size={12} />
                        </div>
                        <span className="text-[13px] font-bold text-greenDark">HatMind AI</span>
                      </div>
                      <p className="text-[13px] text-greenDark/90 leading-relaxed">
                        Excellent use of transactions! However, don't forget to add the corresponding <code className="bg-greenDark/10 px-1 rounded text-greenDark font-mono text-[11px]">client.release()</code> in a <code className="bg-greenDark/10 px-1 rounded text-greenDark font-mono text-[11px]">finally</code> block to prevent connection leaks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stat Card 1 */}
            <div className="absolute -left-10 top-1/4 bg-white/90 backdrop-blur-xl border border-greenDark/10 p-4 rounded-2xl shadow-xl flex flex-col gap-1 animate-[float_6s_ease-in-out_infinite]">
              <span className="text-xs text-gray-500 font-bold uppercase">PRs Reviewed</span>
              <span className="text-3xl font-black text-greenDark">12.8K</span>
              <span className="text-xs text-greenLight font-bold flex items-center gap-1"><Zap size={12}/> +248%</span>
            </div>

            {/* Floating Stat Card 2 */}
            <div className="absolute -right-6 bottom-1/4 bg-white/90 backdrop-blur-xl border border-greenDark/10 p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-[float-reverse_8s_ease-in-out_infinite]">
              <div className="w-10 h-10 rounded-full border-[3px] border-greenLight border-t-transparent animate-spin-slow"></div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase">Merge Speed</span>
                <span className="text-xl font-black text-greenDark">3x Faster</span>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES (4 COL) */}
        <section className="py-20 px-6 border-t border-greenDark/5 bg-cream/50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={GitPullRequest} 
              title="Automated PR Reviews" 
              description="HatMind instantly reviews every PR, providing actionable feedback before a human even looks at it."
            />
            <FeatureCard 
              icon={Github} 
              title="Seamless GitHub App" 
              description="Install our GitHub App and map it to your repos in one click. No complex CI/CD setup required."
            />
            <FeatureCard 
              icon={MessageSquare} 
              title="AI Codebase Chatbot" 
              description="Chat with your entire indexed repository. Ask questions, find bugs, and generate code with full context."
            />
            <FeatureCard 
              icon={Code2} 
              title="Inline Suggestions" 
              description="Get precise line-by-line comments with suggested fixes that you can commit directly from GitHub."
            />
          </div>
        </section>

        {/* DETAILED FEATURES GRID */}
        <section className="py-24 px-6 border-t border-greenDark/5 bg-cream/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-greenLight tracking-widest uppercase mb-4">The Platform</h2>
              <h3 className="text-4xl md:text-5xl font-black tracking-tight text-greenDark">Everything You Need to <span className="text-greenLight">Ship Faster</span></h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DetailedFeatureCard 
                icon={CheckCircle2} title="Pull Request Automation" 
                description="Automatically triggers on new PRs and pushes, ensuring every commit is reviewed against your standards."
              />
              <DetailedFeatureCard 
                icon={Box} title="Context-Aware Chat" 
                description="We index your entire repository using advanced RAG, so our chatbot understands your architecture."
              />
              <DetailedFeatureCard 
                icon={ShieldCheck} title="Security Scanning" 
                description="Detect vulnerabilities, hardcoded secrets, and unsafe patterns before they make it into the main branch."
              />
              <DetailedFeatureCard 
                icon={Zap} title="Performance Optimization" 
                description="Identify slow queries, unoptimized loops, and memory leaks with intelligent static analysis."
              />
              <DetailedFeatureCard 
                icon={LayoutDashboard} title="Custom Review Preferences" 
                description="Configure severity thresholds and focus areas (security, logic, styling) to reduce noise."
              />
              <DetailedFeatureCard 
                icon={Activity} title="Real-Time Notifications" 
                description="Get instantly notified in-app or via email when a review completes or needs your attention."
              />
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-greenDark">Ready to Ship Faster?</h2>
            <p className="text-xl text-gray-700 font-medium mb-10 max-w-2xl mx-auto">Stop guessing. Let AI review your pull requests and get your code merged instantly.</p>
            <Link to="/settings" className="inline-flex items-center gap-2 px-10 py-5 bg-greenDark hover:bg-greenDark/90 text-cream rounded-full font-bold text-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              Connect Your Repository <ArrowRight size={24} />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-greenDark/10 bg-cream pt-16 pb-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10 md:gap-4 mb-16">
            <div className="flex flex-col gap-4 max-w-xs">
              <Link to="/" className="flex items-center gap-2">
                <img src="./HatMind.jpg" alt="Logo" className="h-8 w-auto rounded-lg shadow-sm" />
                <span className="text-xl font-black tracking-tighter text-greenDark">HatMind</span>
              </Link>
              <p className="text-sm text-gray-600 font-medium">
                Your AI pair programmer. Code reviews and codebase chat on autopilot.
              </p>
            </div>
            
            <div className="flex gap-16 flex-wrap">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-greenDark">Product</h4>
                <Link to="/settings" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">GitHub App</Link>
                <Link to="/chat" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">AI Chatbot</Link>
                <Link to="/reviews" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">Reviews</Link>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-greenDark">Resources</h4>
                <Link to="#" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">Documentation</Link>
                <Link to="#" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">Blog</Link>
                <Link to="#" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">Community</Link>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-greenDark">Company</h4>
                <Link to="/about" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">About</Link>
                <Link to="#" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">Privacy Policy</Link>
                <Link to="#" className="text-sm text-gray-600 hover:text-greenDark font-medium transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-greenDark/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 font-medium">© 2026 HatMind. All rights reserved.</p>
            <div className="flex items-center gap-4 text-gray-500">
              <Github size={20} className="hover:text-greenDark cursor-pointer transition-colors" />
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default HomePage;
