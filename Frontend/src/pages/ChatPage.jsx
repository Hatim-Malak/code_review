import { useAuth } from "../store/useAuthStore.js";
import { useMemo, useEffect, useRef, useState } from "react";
import { useChat } from "../store/useChatStore.js";
import CustomNavbar from "../components/CustomNavbar.jsx";
import ChatSidebar from "../components/ChatSidebar.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatedCodeBlock } from "../components/animated-code-block";
import { User, Bot, Send, Code, Sparkles, Zap, ShieldAlert, PanelLeftOpen, Globe } from "lucide-react";
import { Helmet } from "react-helmet-async";

const SuggestionCard = ({ icon: Icon, title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-start gap-2 p-5 bg-white/50 hover:bg-white border border-greenDark/10 hover:border-greenLight/50 rounded-2xl transition-all duration-300 text-left shadow-sm hover:shadow-md group w-full"
  >
    <div className="p-2 rounded-xl bg-cream border border-greenDark/10 text-greenDark group-hover:text-greenLight transition-colors">
      <Icon size={20} />
    </div>
    <div className="flex flex-col">
      <span className="font-bold text-greenDark text-sm">{title}</span>
      <span className="text-greenDark/60 text-xs mt-1">{subtitle}</span>
    </div>
  </button>
);

const ChatPage = () => {
  const { authUser, logout } = useAuth();
  const { chats, sendMessage, connectSocket, loadSessions, isSending, isHistoryLoading } =
    useChat();
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats]);

  const parseAIMessage = (message) => {
    const regex = /```([\s\S]*?)```/g;
    const result = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(message)) !== null) {
      if (match.index > lastIndex) {
        const text = message.slice(lastIndex, match.index).trim();
        if (text) result.push({ type: "text", content: text });
      }
      result.push({ type: "code", content: match[1] });
      lastIndex = regex.lastIndex;
    }
    const remainingText = message.slice(lastIndex).trim();
    if (remainingText) result.push({ type: "text", content: remainingText });
    return result;
  };

  useEffect(() => {
    if (authUser?._id) {
      connectSocket(authUser._id);
      loadSessions();
    }
  }, [authUser]);

  const handleSend = (e) => {
    e.preventDefault();
    const msg = e.target.message.value;
    if (!msg.trim()) return;
    const modelName = authUser?.preferences?.chat?.defaultModel || "llama-3.1-8b-instant";
    sendMessage(msg, modelName);
    e.target.reset();
    // Reset textarea height
    const textarea = e.target.querySelector('textarea');
    if (textarea) textarea.style.height = 'auto';
  };

  const sendSuggestion = (text) => {
    const modelName = authUser?.preferences?.chat?.defaultModel || "llama-3.1-8b-instant";
    sendMessage(text, modelName);
  };

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

  const layout = useMemo(() => {
    return (
      <CustomNavbar
        logo="./HatMind.jpg"
        items={navItems}
        className="lg:left-[300px]"
        onSidebarToggle={() => setSidebarOpen(true)}
      />
    );
  }, [navItems]);

  return (
    <div className="bg-cream flex flex-col h-screen w-full relative">
      <Helmet>
        <title>Chat | HatMind AI</title>
        <meta name="description" content="Chat with HatMind AI. Paste your code for an instant review, optimization suggestions, and bug detection." />
      </Helmet>
      {layout}
      
      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden lg:pl-[300px]">
        {/* Sidebar */}
        <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative min-w-0 pt-[80px]">
          {/* Messages */}
          <div className="flex-1 overflow-auto scrollable pb-32 px-4 flex justify-center pt-4" ref={chatContainerRef}>
            <div className="w-full max-w-4xl flex flex-col gap-8">
              
              {isHistoryLoading ? (
                <div className="flex-1 flex flex-col justify-center items-center mt-20 gap-4 animation-fade-in">
                  <div className="relative flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-greenDark/10 border-t-greenLight rounded-full animate-spin"></div>
                    <Sparkles size={16} className="absolute text-greenDark animate-pulse" />
                  </div>
                  <p className="text-sm text-greenDark/60 font-bold tracking-wide animate-pulse">Loading conversation...</p>
                </div>
              ) : chats.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center mt-10 lg:mt-20 animation-fade-in">
                  <img 
                    src="./HatMind.jpg" 
                    alt="Logo" 
                    className="h-24 w-auto rounded-3xl shadow-xl mb-6 object-contain" 
                  />
                  <h2 className="text-3xl lg:text-4xl font-black text-greenDark mb-3 tracking-tight">How can I help you code today?</h2>
                  <p className="text-lg text-greenDark/70 mb-12 text-center max-w-lg">
                    Paste your Python script below, or try one of these suggestions to get started.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                    <SuggestionCard 
                      icon={Code} 
                      title="Code Review" 
                      subtitle="Analyze my script for best practices"
                      onClick={() => sendSuggestion("Please review my Python code for best practices and readability.")}
                    />
                    <SuggestionCard 
                      icon={Zap} 
                      title="Optimize Performance" 
                      subtitle="Make my algorithms run faster"
                      onClick={() => sendSuggestion("How can I optimize my Python code to run faster and use less memory?")}
                    />
                    <SuggestionCard 
                      icon={ShieldAlert} 
                      title="Find Bugs" 
                      subtitle="Locate logical errors or exceptions"
                      onClick={() => sendSuggestion("Can you help me find bugs or potential edge cases in my code?")}
                    />
                    <SuggestionCard 
                      icon={Sparkles} 
                      title="Refactor Logic" 
                      subtitle="Rewrite for modern Python (PEP 8)"
                      onClick={() => sendSuggestion("Help me refactor my code to follow PEP 8 and modern Python conventions.")}
                    />
                  </div>
                </div>
              ) : null}

              {chats.map((chat, i) => (
                <div key={i} className="w-full flex flex-col gap-6">
                  {/* User Message */}
                  <div className="w-full flex items-start gap-4 justify-end">
                    <div className="p-4 bg-greenLight max-w-[85%] md:max-w-[70%] flex flex-col gap-1 rounded-2xl rounded-tr-sm shadow-md order-1">
                      <p className="text-[15px] text-cream font-medium whitespace-pre-wrap leading-relaxed">
                        {chat.user_message}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-greenDark/10 flex justify-center items-center border border-greenDark/20 order-2 flex-shrink-0">
                      <User size={20} className="text-greenDark" />
                    </div>
                  </div>

                  {/* AI Message */}
                  <div className="w-full flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-greenDark flex justify-center items-center shadow-md flex-shrink-0">
                      <Bot size={20} className="text-cream" />
                    </div>
                    <div className="p-5 bg-white/70 backdrop-blur-sm max-w-[90%] md:max-w-[80%] flex flex-col gap-4 rounded-2xl rounded-tl-sm shadow-sm border border-greenDark/10">
                      <div className="flex flex-col gap-3">
                        {chat.AI_message ? (
                          parseAIMessage(chat.AI_message).map((part, idx) =>
                            part.type === "text" ? (
                              <div
                                key={idx}
                                className="text-[15px] text-greenDark font-medium leading-relaxed markdown-body"
                              >
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {part.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div key={idx} className="rounded-xl overflow-hidden shadow-sm border border-greenDark/20 my-2">
                                <AnimatedCodeBlock
                                  code={part.content}
                                  theme="dark"
                                  typingSpeed={20}
                                  showLineNumbers
                                  autoPlay={i === chats.length - 1}
                                />
                              </div>
                            )
                          )
                        ) : (
                          <div className="flex items-center gap-2 text-[15px] text-greenDark font-medium py-2">
                            <Sparkles size={16} className="animate-pulse text-greenLight" />
                            <span>Analyzing code</span>
                            <span className="flex gap-1">
                              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* RAG Sources Metadata */}
                      {chat.rag_sources && chat.rag_sources.length > 0 && (
                        <div className="mt-2 pt-3 border-t border-greenDark/10 flex flex-col gap-2 animation-fade-in">
                          <span className="text-xs font-bold text-greenDark/70 uppercase tracking-wider flex items-center gap-1">
                            <Globe size={12} className="text-greenLight" />
                            Sources Utilized
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {chat.rag_sources.map((sourceUrl, idx) => (
                              <a 
                                key={idx} 
                                href={sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-greenDark bg-greenLight/10 hover:bg-greenLight/20 px-2.5 py-1.5 rounded-lg border border-greenDark/10 transition-colors truncate max-w-[250px] font-medium flex items-center gap-1"
                                title={sourceUrl}
                              >
                                {(() => {
                                  try {
                                    return new URL(sourceUrl).hostname.replace('www.', '');
                                  } catch (e) {
                                    const filename = sourceUrl.split(/[/\\]/).pop() || sourceUrl;
                                    return filename.length > 30 ? filename.slice(0, 30) + "..." : filename;
                                  }
                                })()}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-40 flex-shrink-0" /> {/* Spacer for scrolling */}
            </div>
          </div>

          {/* Premium Prompt Bar */}
          <div className="w-full absolute bottom-0 z-20 bg-gradient-to-t from-cream via-cream to-transparent pb-6 pt-10 px-4">
            <form
              onSubmit={handleSend}
              className="flex justify-center items-end w-full max-w-4xl mx-auto gap-2 bg-white rounded-3xl p-2 shadow-[0_10px_40px_rgba(13,83,14,0.1)] border border-greenDark/10 transition-all focus-within:shadow-[0_10px_40px_rgba(48,109,41,0.2)] focus-within:border-greenLight/50"
            >
              <textarea
                name="message"
                autoComplete="off"
                rows="1"
                placeholder="Message HatMind or paste code..."
                className="flex-1 bg-transparent py-3 px-4 placeholder:text-greenDark/40 text-[15px] text-greenDark font-medium outline-none resize-none min-h-[44px] max-h-32 scrollable"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.target.closest('form');
                    if (e.target.value.trim() && !isSending) {
                      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  }
                }}
              />
              <button
                disabled={isSending}
                type="submit"
                className="bg-greenDark hover:bg-greenLight disabled:bg-creamDark disabled:text-greenDark/50 text-cream w-10 h-10 rounded-2xl flex justify-center items-center transition-all shadow-sm flex-shrink-0 mb-1 mr-1"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-xs text-greenDark/50 font-medium">HatMind AI can make mistakes. Verify critical code before deploying.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
