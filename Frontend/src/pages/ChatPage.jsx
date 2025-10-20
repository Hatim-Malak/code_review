import { useAuth } from "../store/useAuthStore.js";
import { useMemo, useEffect, useRef } from "react";
import { useChat } from "../store/useChatStore.js";
import PillNav from "../component/PillNav.jsx";
import { AnimatedCodeBlock } from "../components/ui/animated-code-block";

const ChatPage = () => {
  const { authUser, logout } = useAuth();
  const { chats, sendMessage, connectSocket, loadHistory, isSending } =
    useChat();
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chats]); // ✅ Scrolls automatically on new messages

  // Split AI message into an array of { type: 'text' | 'code', content: string }
  const parseAIMessage = (message) => {
    const regex = /```([\s\S]*?)```/g; // matches ```code```
    const result = [];
    let lastIndex = 0;

    let match;
    while ((match = regex.exec(message)) !== null) {
      // push text before the code block
      if (match.index > lastIndex) {
        const text = message.slice(lastIndex, match.index).trim();
        if (text) result.push({ type: "text", content: text });
      }

      // push the code block
      result.push({ type: "code", content: match[1] });
      lastIndex = regex.lastIndex;
    }

    // push remaining text after last code block
    const remainingText = message.slice(lastIndex).trim();
    if (remainingText) result.push({ type: "text", content: remainingText });

    return result;
  };

  useEffect(() => {
    if (authUser?._id) {
      connectSocket(authUser._id);
      loadHistory();
    }
  }, [authUser]);

  const handleSend = (e) => {
    e.preventDefault();
    const msg = e.target.message.value;
    sendMessage(msg);
    e.target.reset();
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    ...(authUser
      ? [
          { label: "Logout", href: "#", onClick: logout }, // show logout if logged in
        ]
      : [
          { label: "Login", href: "/login" },
          { label: "Sign Up", href: "/signup" },
        ]),
  ];
  const layout = useMemo(() => {
    return (
      <div className="w-full h-[10%] bg-dark backdrop-blur-lg fixed top-2 overflow-hidden">
        <div className="w-full flex justify-center items-center z-10">
          <PillNav
            logo="./ai.png"
            logoAlt="Company Logo"
            items={navItems}
            activeHref="/signup"
            className="custom-nav"
            ease="power2.easeOut"
            baseColor="#EEEEEE"
            pillColor="#222831"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#EEEEEE"
          />
        </div>
      </div>
    );
  }, []);
  return (
    <div className=" bg-dark flex justify-center items-center gap-2 flex-col h-screen w-full relative">
      {layout}
      <div className="h-[78%] flex overflow-auto scrollable justify-center items-center" ref={chatContainerRef}>
        <div className="lg:w-[50%] flex flex-col gap-2 p-4 h-full rounded-lg ">
          {chats.map((chat, i) => (
            <div key={i} className="w-full flex flex-col gap-10">
              <div className="w-full flex flex-col items-start">
                <div className="p-3 bg-grayish max-w-[50%] flex flex-col gap-3 rounded-xl">
                  <h1 className="text-xl text-red-500 font-bold ">You</h1>
                  <h1 className="text-xl text-light font-bold">
                    {chat.user_message}
                  </h1>
                </div>
              </div>
              <div className="w-full flex flex-col items-end">
                <div className="p-3 bg-grayish max-w-[50%] flex flex-col gap-10 rounded-xl">
                  <h1 className="text-xl text-green-500 font-bold ">
                    AI message
                  </h1>
                  <h1 className="text-xl text-light font-bold">
                    <div className="flex flex-col gap-2">
                      {chat.AI_message ? (
                        parseAIMessage(chat.AI_message).map((part, idx) =>
                          part.type === "text" ? (
                            <p
                              key={idx}
                              className="text-xl text-light font-bold"
                            >
                              {part.content}
                            </p>
                          ) : (
                            <AnimatedCodeBlock
                              key={idx}
                              code={part.content}
                              theme="dark"
                              typingSpeed={50}
                              showLineNumbers
                              autoPlay={true}
                            />
                          )
                        )
                      ) : (
                        <p className="text-xl text-light font-bold">
                          AI is typing...
                        </p>
                      )}
                    </div>
                  </h1>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="gap-3 flex justify-center items-center w-full fixed bottom-0 z-50 py-6 "
      >
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="w-[45%] bg-grayish py-3 rounded-full px-5 placeholder:text-xl text-xl placeholder:text-light text-light placeholder:font-bold font-bold"
        />
        <button
          disabled={isSending}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
