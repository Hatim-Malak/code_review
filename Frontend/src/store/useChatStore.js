import { create } from "zustand";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useChat = create((set, get) => ({
  chats: [],
  isSending: false,
  socket: null,
  socketConnected: false,

  connectSocket: (userId) => {
    if (!userId) return;

    // ✅ Prevent multiple socket connections
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) {
      console.log("Socket already connected");
      return;
    }

    const socket = io("http://localhost:5000", { withCredentials: true });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("joinUserRoom", userId);
      set({ socketConnected: true });
    });

    // ✅ Remove old listener before adding new one
    socket.off("aiMessage");

    socket.on("aiMessage", (data) => {
      console.log("AI message received:", data);

      set((state) => {
        const chatsCopy = [...state.chats];
        const lastIndex = chatsCopy
          .map((c, idx) => (c.AI_message === null ? idx : -1))
          .filter((i) => i !== -1)
          .pop();

        if (lastIndex !== undefined && lastIndex >= 0) {
          chatsCopy[lastIndex] = {
            ...chatsCopy[lastIndex],
            AI_message: data.aiMessage,
          };
        } else {
          chatsCopy.push({
            user_message: data.userMessage,
            AI_message: data.aiMessage,
          });
        }

        return { chats: chatsCopy };
      });
    });

    set({ socket });
  },

  sendMessage: async (query, model_name = "llama-3.1-8b-instant") => {
    const { chats } = get();
    if (!query.trim()) return toast.error("Please enter a message");

    try {
      set({ isSending: true });
      set({
        chats: [...chats, { user_message: query, AI_message: null }],
      });

      await axiosInstance.post("/chat/add_chat", { query, model_name });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message");
    } finally {
      set({ isSending: false });
    }
  },

  loadHistory: async () => {
    try {
      const res = await axiosInstance.get("/chat/history");
      if (res.data) set({ chats: res.data });
    } catch (error) {
      console.error("Error loading history:", error);
    }
  },
}));
