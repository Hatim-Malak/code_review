import { create } from "zustand";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useChat = create((set, get) => ({
  chats: [],
  isSending: false,
  socket: null,
  socketConnected: false,

  // Session management state
  sessions: [],
  activeSessionId: null,
  selectedRepoId: null,
  isLoadingSessions: false,
  isHistoryLoading: false,

  connectSocket: (userId) => {
    if (!userId) return;

    // ✅ Prevent multiple socket connections
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) {
      console.log("Socket already connected");
      return;
    }

    const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "https://hatmind.duckdns.org";
    const socket = io(backendUrl, { withCredentials: true });

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

  // Load all conversation sessions for the sidebar
  loadSessions: async () => {
    const { selectedRepoId } = get();
    if (!selectedRepoId) return set({ sessions: [] });
    try {
      set({ isLoadingSessions: true });
      const res = await axiosInstance.get(`/chat/sessions?repoId=${selectedRepoId}`);
      if (res.data) set({ sessions: res.data });
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error(error.response?.data?.message || "Failed to load chat sessions");
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  // Select a session and load its messages
  selectSession: async (conversationId) => {
    try {
      set({ activeSessionId: conversationId, chats: [], isHistoryLoading: true });
      const res = await axiosInstance.get(`/chat/history?converId=${conversationId}`);
      if (res.data) set({ chats: res.data });
    } catch (error) {
      console.error("Error loading session history:", error);
      toast.error(error.response?.data?.message || "Failed to load chat history");
      set({ chats: [] });
    } finally {
      set({ isHistoryLoading: false });
    }
  },

  // Start a fresh conversation
  startNewChat: () => {
    set({ activeSessionId: null, chats: [] });
    // selectedRepoId is intentionally preserved — new chat stays in the same repo
  },

  // Delete a session
  deleteSession: async (conversationId) => {
    try {
      await axiosInstance.delete(`/chat/session/${conversationId}`);
      const { activeSessionId } = get();
      // If the deleted session was active, clear the chat
      if (activeSessionId === conversationId) {
        set({ activeSessionId: null, chats: [] });
      }
      // Reload sessions list
      get().loadSessions();
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete conversation");
    }
  },

  sendMessage: async (query, model_name = "llama-3.1-8b-instant") => {
    const { chats, activeSessionId, selectedRepoId } = get();
    if (!query.trim()) return toast.error("Please enter a message");
    if (!selectedRepoId) return toast.error("Please select a repository first");

    try {
      set({ isSending: true });
      set({
        chats: [...chats, { user_message: query, AI_message: null }],
      });

      const res = await axiosInstance.post("/chat/add_chat", {
        query,
        model_name,
        converId: activeSessionId,
        repoId: selectedRepoId,
      });

      // If this was a new conversation, store the returned conversationId
      if (res.data?.conversationId && !activeSessionId) {
        set({ activeSessionId: res.data.conversationId });
      }

      // Reload sessions to show the new/updated conversation in sidebar
      get().loadSessions();
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg = error?.response?.data?.message || error.message || "Error sending message";
      toast.error(errorMsg);
    } finally {
      set({ isSending: false });
    }
  },

  loadHistory: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId) return;
    try {
      const res = await axiosInstance.get(`/chat/history?converId=${activeSessionId}`);
      if (res.data) set({ chats: res.data });
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error(error.response?.data?.message || "Failed to load chat history");
    }
  },

  selectRepo: (repoId) => {
    set({ selectedRepoId: repoId, activeSessionId: null, chats: [], sessions: [] });
    get().loadSessions();
  },
}));
