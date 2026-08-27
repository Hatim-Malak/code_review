import React, { useState } from "react";
import { useAuth } from "../../store/useAuthStore.js";
import { useSettingsStore } from "../../store/useSettingsStore.js";
import { Loader2, MessageSquare } from "lucide-react";

const ChatPrefsSection = () => {
  const { authUser, updateAuthUser } = useAuth();
  const { updateGlobalPreferences, isUpdatingPreferences } = useSettingsStore();

  const [prefsData, setPrefsData] = useState({
    defaultModel: authUser?.preferences?.chat?.defaultModel || "openai/gpt-oss-20b",
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateGlobalPreferences({ chat: prefsData });
      updateAuthUser(updatedUser);
    } catch (error) {
      // Handled by store
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-greenDark mb-1">Chat Preferences</h2>
        <p className="text-gray-500 mb-6">Configure the HatMind AI chat assistant.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label className="text-base font-medium text-gray-900 block mb-1">Default Chat Model</label>
            <p className="text-sm text-gray-500 mb-3">Select the AI model that will be used by default when you start a new conversation.</p>
            <div className="space-y-3">
              <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                prefsData.defaultModel === "openai/gpt-oss-120b" ? "border-greenDark bg-greenLight/5 ring-1 ring-greenDark" : "border-gray-200 bg-white hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="chatModel"
                  value="openai/gpt-oss-120b"
                  checked={prefsData.defaultModel === "openai/gpt-oss-120b"}
                  onChange={(e) => setPrefsData({ ...prefsData, defaultModel: e.target.value })}
                  className="mt-1 w-4 h-4 text-greenDark focus:ring-greenDark"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">GPT-OSS 120B</div>
                  <div className="text-sm text-gray-500 mt-1">Slower, but highly capable. Best for complex reasoning, architectural questions, and deep debugging.</div>
                </div>
              </label>

              <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                prefsData.defaultModel === "openai/gpt-oss-20b" ? "border-greenDark bg-greenLight/5 ring-1 ring-greenDark" : "border-gray-200 bg-white hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="chatModel"
                  value="openai/gpt-oss-20b"
                  checked={prefsData.defaultModel === "openai/gpt-oss-20b"}
                  onChange={(e) => setPrefsData({ ...prefsData, defaultModel: e.target.value })}
                  className="mt-1 w-4 h-4 text-greenDark focus:ring-greenDark"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    GPT-OSS 20B 
                    <span className="px-2 py-0.5 bg-greenLight/10 text-greenDark text-xs rounded-full font-medium">Recommended</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Extremely fast responses. Great for quick questions, syntax help, and general chat.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-start gap-4">
          <MessageSquare className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-700">Did you know?</h4>
            <p className="text-sm text-gray-500 mt-1">
              You can override this default on a per-conversation basis using the model selector at the top of the chat interface.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isUpdatingPreferences}
            className="px-6 py-2.5 bg-greenDark text-cream rounded-xl font-medium hover:bg-greenLight transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdatingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Chat Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPrefsSection;
