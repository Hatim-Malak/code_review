import React, { useEffect } from "react";
import { useChat } from "../store/useChat";
import { useAuth } from "../store/useAuthStore"; // if you store user info here

export default function ChatPage() {
  const { chats, sendMessage, connectSocket, loadHistory, isSending } = useChat();
  const { user } = useAuth(); // assume user._id exists

  useEffect(() => {
    if (user?._id) {
      connectSocket(user._id);
      loadHistory();
    }
  }, [user]);

  const handleSend = (e) => {
    e.preventDefault();
    const msg = e.target.message.value;
    sendMessage(msg);
    e.target.reset();
  };

  return (
    <div className="p-4">
      <div className="chat-box bg-gray-100 p-4 rounded-lg h-[400px] overflow-y-auto">
        {chats.map((chat, i) => (
          <div key={i} className="mb-3">
            <p className="text-blue-600 font-semibold">You: {chat.user_message}</p>
            {chat.AI_message && (
              <p className="text-green-600">AI: {chat.AI_message}</p>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex">
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="flex-grow border p-2 rounded-l-lg"
        />
        <button
          disabled={isSending}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-lg"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
