import React, { useEffect, useState } from "react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../store/useAuthStore.js";
import { Helmet } from "react-helmet-async";
import {
  Github, MessageSquare, Sparkles, ShieldCheck,
  CheckCircle2, ArrowRight, PlayCircle, ChevronRight,
  Bot, AlertTriangle,
} from "lucide-react";

/* Reused "window" motif — the one signature visual, shown in different
   contexts (a review, a chat, a scan, a repo list) rather than repeated
   icon-and-card grids. */
const WindowPanel = ({ label, live, children }) => (
  <div className="rounded-2xl shadow-xl border border-greenDark/10 overflow-hidden bg-[#0d1117] text-left">
    <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-white/5">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
      </div>
      <div className="ml-2 text-xs text-gray-400 font-mono truncate">{label}</div>
      {live && (
        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-greenLight shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-greenLight animate-pulse"></span>
          live
        </div>
      )}
    </div>
    <div className="px-5 py-5">{children}</div>
  </div>
);

const ShowcaseRow = ({ eyebrow, title, description, points, reverse, visual, first }) => (
  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 md:py-20 ${first ? "" : "border-t border-greenDark/10"}`}>
    <div className={reverse ? "lg:order-2" : ""}>
      <span className="text-xs font-bold text-greenLight tracking-widest uppercase">{eyebrow}</span>
      <h3 className="text-3xl md:text-4xl font-black tracking-tight text-greenDark mt-3 mb-5">{title}</h3>
      <p className="text-lg text-gray-600 leading-relaxed font-medium mb-6">{description}</p>
      <ul className="space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-base text-gray-700 font-medium">
            <CheckCircle2 size={18} className="text-greenLight shrink-0 mt-0.5" />
            {p}
          </li>
        ))}
      </ul>
    </div>
    <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
  </div>
);

const CAPABILITIES = [
  { title: "Actionable Feedback", desc: "Line-by-line comments with fixes you can commit immediately." },
  { title: "Semantic Architecture Understanding", desc: "RAG indexing shows how your services actually connect." },
  { title: "Style Standard Enforcement", desc: "Your team's guidelines, enforced without manual nitpicking." },
  { title: "Custom Review Thresholds", desc: "Silence minor style noise and focus purely on logic." },
  { title: "Real-Time Analytics", desc: "Track merge speed and the drop in post-deploy bugs." },
  { title: "Sub-Second Latency", desc: "Standard pull requests process in seconds, not minutes." },
];

const STATS = [
  { value: "3", label: "Static analyzers grounding every review" },
  { value: "<3s", label: "Average pull request turnaround" },
  { value: "100%", label: "Comments anchored to an exact line" },
  { value: "0", label: "CI config files required to start" },
];

const HomePage = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const [reviewState, setReviewState] = useState("scanning"); // 'scanning' -> 'complete'
  const { authUser, logout } = useAuth();

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeIn(true), 100);
    const reviewTimer = setTimeout(() => setReviewState("complete"), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(reviewTimer);
    };
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "About", href: "/about" },
    ...(authUser
      ? [
          { label: "HatMind AI", href: "/chat" },
          { label: "Pull Requests", href: "/reviews" },
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

        {/* HERO — asymmetric split, not a centered stack */}
        <section className="relative pt-36 pb-28 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-16 items-center">

            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-greenDark/5 border border-greenDark/10 text-xs font-bold uppercase tracking-widest text-greenDark shadow-sm mb-8">
                <Sparkles size={14} className="text-greenLight" />
                RAG-Powered Code Review
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tighter leading-[1.08] text-greenDark">
                Ship perfect code.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-greenDark to-greenLight">
                  Without the bottleneck.
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium mt-7">
                HatMind pairs static analysis with a RAG-grounded LLM to review every pull request in seconds —
                then lets your team chat with the entire codebase.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mt-9">
                <Link to={authUser ? "/settings" : "/signup"} className="w-full sm:w-auto px-8 py-4 bg-greenDark hover:bg-greenDark/90 text-cream rounded-xl font-bold text-base transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
                  Get Started for Free <ArrowRight size={18} />
                </Link>
                <Link to="/chat" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 border-2 border-greenDark/10 rounded-xl font-bold text-base text-greenDark transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                  Try Interactive Demo <PlayCircle size={18} />
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2.5 text-sm font-bold text-gray-500 mt-10 flex-wrap">
                <span className="text-greenDark">Connect repo</span>
                <ChevronRight size={14} />
                <span className="text-greenDark">AI reviews PR</span>
                <ChevronRight size={14} />
                <span className="text-greenDark">Chat with codebase</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-greenLight/20 to-transparent blur-3xl -z-10 rounded-full opacity-50"></div>

              <div
                className={`absolute -top-5 right-4 sm:right-8 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-greenDark/10 shadow-lg transition-all duration-500 ${
                  reviewState === "complete" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <CheckCircle2 size={16} className="text-greenLight" />
                <span className="text-sm font-bold text-greenDark">
                  Review complete <span className="text-gray-400 font-medium">· 2.4s</span>
                </span>
              </div>

              <WindowPanel label="checkout/payments.py" live={reviewState === "scanning"}>
                <div className="font-mono text-[13px] sm:text-sm leading-7 overflow-hidden">
                  <div className="text-gray-500">def get_stripe_client():</div>
                  <div className="bg-red-500/10 -mx-5 px-5 text-red-300 whitespace-nowrap">
                    <span className="text-red-500/70 select-none mr-3">−</span>api_key = "sk_live_51Hc29Shd8Ha03pQmz..."
                  </div>
                  <div className="bg-green-500/10 -mx-5 px-5 text-green-300 whitespace-nowrap">
                    <span className="text-green-500/70 select-none mr-3">+</span>api_key = os.environ["STRIPE_SECRET_KEY"]
                  </div>
                  <div className="text-gray-500">    return stripe.Client(api_key=api_key)</div>
                </div>

                <div
                  className={`mt-5 pt-5 border-t border-white/5 transition-all duration-700 ${
                    reviewState === "complete" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-greenDark/80 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-cream" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-bold text-gray-100">HatMind</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={11} /> Critical
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Hardcoded secret detected (Bandit B105). Move credentials to environment variables — never commit live keys.
                      </p>
                    </div>
                  </div>
                </div>
              </WindowPanel>
            </div>

          </div>
        </section>

        {/* FEATURE SHOWCASE — alternating rows, each backed by the same panel motif in a new context */}
        <section className="px-6 max-w-6xl mx-auto">
          <ShowcaseRow
            first
            eyebrow="Automated Reviews"
            title="Every pull request, reviewed before a human looks."
            description="Static analysis catches the obvious. The LLM catches the rest — logic errors, unsafe patterns, and edge cases that pattern-matching alone would miss."
            points={["Line-by-line comments with suggested fixes", "Runs on every push, no manual trigger needed", "Grounded in Bandit and Ruff, not guesswork"]}
            visual={
              <WindowPanel label="checkout/pricing.py — review">
                <div className="font-mono text-xs sm:text-sm leading-6">
                  <div className="text-gray-500">def calculate_discount(cart):</div>
                  <div className="bg-red-500/10 -mx-5 px-5 text-red-300">
                    <span className="text-red-500/70 select-none mr-2">−</span>return cart.total * 0.5
                  </div>
                  <div className="bg-green-500/10 -mx-5 px-5 text-green-300">
                    <span className="text-green-500/70 select-none mr-2">+</span>return cart.total * min(coupon.rate, MAX_DISCOUNT)
                  </div>
                  <div className="mt-4 flex items-start gap-2 text-gray-400">
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                    Unbounded discount — a malformed coupon could zero out the cart total.
                  </div>
                </div>
              </WindowPanel>
            }
          />

          <ShowcaseRow
            reverse
            eyebrow="Codebase Chat"
            title="Ask your codebase questions in plain English."
            description="No more grepping through unfamiliar files. HatMind indexes your repository with RAG, so answers are grounded in the code that actually exists — with citations."
            points={["Answers cite the exact file and line", "Understands cross-service architecture", "Works on any repo the moment it's connected"]}
            visual={
              <WindowPanel label="chat — hatmind">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-white/10 px-4 py-2.5 text-gray-200">
                      How does checkout handle refunds?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-greenDark/40 px-4 py-2.5 text-gray-200 leading-relaxed">
                      Refunds run through <code className="text-greenLight font-mono text-xs">process_refund()</code>, which calls Stripe's Refund API and marks the order <code className="text-greenLight font-mono text-xs">REFUNDED</code>.
                      <div className="mt-2">
                        <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-gray-400">checkout/refunds.py:42</span>
                      </div>
                    </div>
                  </div>
                </div>
              </WindowPanel>
            }
          />

          <ShowcaseRow
            eyebrow="Security"
            title="Enterprise-grade checks, on every commit."
            description="Vulnerable dependencies, hardcoded secrets, and unsafe execution patterns get flagged before they ever reach a deploy."
            points={["Dependency audits on every pull request", "Secret scanning built in, not bolted on", "Findings prioritized by real severity"]}
            visual={
              <WindowPanel label="security-scan.log">
                <div className="space-y-3.5 font-mono text-sm">
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 size={16} className="text-greenLight shrink-0" /> No hardcoded secrets found
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 size={16} className="text-greenLight shrink-0" /> 12 dependencies audited
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <AlertTriangle size={16} className="text-yellow-400 shrink-0" /> 1 unsafe deserialization pattern
                  </div>
                </div>
              </WindowPanel>
            }
          />

          <ShowcaseRow
            reverse
            eyebrow="GitHub Native"
            title="Install the app. Skip the pipeline."
            description="No YAML to write, no CI stage to wire up. Connect a repository and HatMind starts reviewing on the very next pull request."
            points={["One-click install from the GitHub Marketplace", "Works alongside your existing CI, not instead of it", "Per-repo isolation for private codebases"]}
            visual={
              <WindowPanel label="github.com/acme">
                <div className="space-y-3">
                  {[
                    { name: "acme/checkout-service", status: "Active" },
                    { name: "acme/payments-api", status: "Active" },
                    { name: "acme/auth-gateway", status: "Reviewing…" },
                  ].map((repo) => (
                    <div key={repo.name} className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2.5 text-sm font-mono text-gray-300 truncate">
                        <Github size={14} className="text-gray-500 shrink-0" />
                        {repo.name}
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${repo.status === "Active" ? "bg-greenLight/10 text-greenLight" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {repo.status}
                      </span>
                    </div>
                  ))}
                </div>
              </WindowPanel>
            }
          />
        </section>

        {/* CAPABILITIES — a spec sheet, not another card grid */}
        <section className="py-24 px-6 bg-white border-y border-greenDark/10">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14">
              <h2 className="text-sm font-bold text-greenLight tracking-widest uppercase mb-3">Capabilities</h2>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight text-greenDark">Everything else you'd expect.</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
              {CAPABILITIES.map((c, i) => (
                <div
                  key={c.title}
                  className={`flex items-start gap-4 py-6 ${i < CAPABILITIES.length - 2 ? "border-b border-greenDark/10" : ""}`}
                >
                  <ShieldCheck size={20} className="text-greenDark/40 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-base font-bold text-greenDark mb-1">{c.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS — grounded in what the product actually does, not fabricated adoption numbers */}
        <section className="py-20 px-6 bg-greenDark">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="text-4xl md:text-5xl font-black tracking-tighter text-cream mb-2">{s.value}</div>
                <div className="text-sm text-cream/60 font-medium leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA — a boxed callout, not a full-bleed band */}
        <section className="py-28 px-6">
          <div className="max-w-6xl mx-auto rounded-[2.5rem] bg-greenDark px-8 md:px-16 py-20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-greenLight to-transparent mix-blend-overlay"></div>
            <div className="relative z-10 text-center flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-cream">Automate your engineering standards.</h2>
              <p className="text-lg text-cream/80 font-medium mb-10 max-w-xl mx-auto leading-relaxed">
                Connect a repository and get your first automated review on the next pull request.
              </p>
              <Link to={authUser ? "/settings" : "/signup"} className="inline-flex items-center gap-3 px-10 py-5 bg-cream hover:bg-white text-greenDark rounded-xl font-bold text-lg transition-all shadow-2xl hover:-translate-y-1 group">
                Start Free Trial <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
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

export default HomePage;