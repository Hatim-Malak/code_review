import React, { useState } from "react";
import { useChat } from "../store/useChatStore.js";
import { useDebounce } from "../hooks/useDebounce.js";
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

const getRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ChatSidebar = ({ isOpen, onClose }) => {
  const {
    sessions,
    activeSessionId,
    isLoadingSessions,
    selectSession,
    startNewChat,
    deleteSession,
  } = useChat();

  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSessions = sessions.filter(session => 
    (session.title || "Untitled Chat").toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleDelete = async (e, conversationId) => {
    e.stopPropagation();
    if (confirmDeleteId === conversationId) {
      setDeletingId(conversationId);
      await deleteSession(conversationId);
      setDeletingId(null);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(conversationId);
      // Auto-reset confirm after 3 seconds
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleNewChat = () => {
    startNewChat();
    onClose?.();
  };

  const handleSelectSession = (id) => {
    selectSession(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 z-[60]
          top-0 h-full lg:z-[40]
          w-[300px] bg-cream/95 backdrop-blur-xl
          border-r border-greenDark/10
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          shadow-[4px_0_24px_rgba(13,83,14,0.06)]
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-greenDark flex justify-center items-center shadow-sm">
                <Sparkles size={14} className="text-cream" />
              </div>
              <span className="text-sm font-black tracking-tight text-greenDark">
                Chat History
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl hover:bg-greenDark/10 text-greenDark/60 hover:text-greenDark transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl
              bg-greenDark text-cream font-bold text-sm
              hover:bg-greenLight
              shadow-md hover:shadow-lg
              transition-all duration-300
              group mb-4"
          >
            <div className="w-7 h-7 rounded-xl bg-cream/20 flex justify-center items-center group-hover:bg-cream/30 transition-colors">
              <Plus size={16} />
            </div>
            New Chat
          </button>

          {/* Search Bar */}
          <div className="relative w-full group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-greenDark/40 group-focus-within:text-greenLight transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-creamDark/30 border border-greenDark/10 text-greenDark text-[13px] font-medium rounded-xl py-2.5 pl-9 pr-4 outline-none focus:bg-white focus:border-greenLight/50 focus:shadow-sm transition-all placeholder:text-greenDark/40"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-greenDark/30 hover:text-greenDark transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-auto scrollable px-3 pb-4">
          {isLoadingSessions ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-greenDark/30 border-t-greenDark rounded-full animate-spin" />
              <span className="text-xs text-greenDark/50 font-medium">
                Loading chats...
              </span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-greenDark/5 flex justify-center items-center">
                <MessageSquare
                  size={24}
                  className="text-greenDark/30"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-greenDark/50 mb-1">
                  No conversations yet
                </p>
                <p className="text-xs text-greenDark/40">
                  Start a new chat to begin
                </p>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm font-bold text-greenDark/40">No matches found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 mt-1">
              {filteredSessions.map((session) => {
                const isActive =
                  activeSessionId === session.conversationId;
                const isDeleting = deletingId === session.conversationId;
                const isConfirming =
                  confirmDeleteId === session.conversationId;

                return (
                  <div
                    key={session.conversationId}
                    onClick={() =>
                      handleSelectSession(session.conversationId)
                    }
                    className={`
                      group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-greenDark text-cream shadow-md"
                          : "text-greenDark hover:bg-greenDark/5"
                      }
                      ${isDeleting ? "opacity-50 pointer-events-none" : ""}
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex justify-center items-center flex-shrink-0 transition-colors
                      ${
                        isActive
                          ? "bg-cream/15"
                          : "bg-greenDark/5 group-hover:bg-greenDark/10"
                      }`}
                    >
                      <MessageSquare
                        size={14}
                        className={
                          isActive
                            ? "text-cream/80"
                            : "text-greenDark/50"
                        }
                      />
                    </div>

                    {/* Title + Time */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13px] font-semibold truncate leading-snug ${
                          isActive
                            ? "text-cream"
                            : "text-greenDark/80"
                        }`}
                      >
                        {session.title || "Untitled Chat"}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-0.5 ${
                          isActive
                            ? "text-cream/50"
                            : "text-greenDark/40"
                        }`}
                      >
                        <Clock size={10} />
                        <span className="text-[11px]">
                          {getRelativeTime(session.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) =>
                        handleDelete(e, session.conversationId)
                      }
                      className={`
                        flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
                        ${
                          isConfirming
                            ? "bg-red-500/20 text-red-500 opacity-100"
                            : isActive
                            ? "text-cream/40 hover:text-cream hover:bg-cream/10 opacity-0 group-hover:opacity-100"
                            : "text-greenDark/30 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                        }
                      `}
                      title={
                        isConfirming ? "Click again to confirm" : "Delete"
                      }
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-greenDark/5 flex-shrink-0">
          <p className="text-[11px] text-greenDark/30 font-medium text-center">
            {filteredSessions.length} conversation{filteredSessions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
