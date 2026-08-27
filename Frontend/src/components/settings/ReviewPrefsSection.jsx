import React, { useState } from "react";
import { useAuth } from "../../store/useAuthStore.js";
import { useSettingsStore } from "../../store/useSettingsStore.js";
import { Loader2 } from "lucide-react";

const ReviewPrefsSection = () => {
  const { authUser, updateAuthUser } = useAuth();
  const { updateGlobalPreferences, isUpdatingPreferences } = useSettingsStore();

  const [prefsData, setPrefsData] = useState({
    defaultMinSeverity: authUser?.preferences?.review?.defaultMinSeverity || "info",
    activeTriggers: authUser?.preferences?.review?.activeTriggers || ["pr", "push"],
    defaultModel: authUser?.preferences?.review?.defaultModel || "openai/gpt-oss-120b"
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateGlobalPreferences({ review: prefsData });
      updateAuthUser(updatedUser);
    } catch (error) {
      // Handled by store
    }
  };

  const toggleTrigger = (trigger) => {
    setPrefsData((prev) => {
      const active = prev.activeTriggers || [];
      if (active.includes(trigger)) {
        return { ...prev, activeTriggers: active.filter(t => t !== trigger) };
      } else {
        return { ...prev, activeTriggers: [...active, trigger] };
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-greenDark mb-1">Global Review Preferences</h2>
        <p className="text-gray-500 mb-6">Set the default behavior for new repositories. These can be overridden per repository.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-8">
        <div className="space-y-3">
          <label className="text-base font-medium text-gray-900 block">Minimum Severity to Report</label>
          <p className="text-sm text-gray-500 mb-3">Only findings with this severity or higher will be added as comments.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["info", "warning", "error"].map((sev) => (
              <label
                key={sev}
                className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all ${
                  prefsData.defaultMinSeverity === sev
                    ? "border-greenDark bg-greenLight/5 ring-1 ring-greenDark"
                    : "border-gray-200 bg-white hover:bg-gray-50 hover:border-greenLight/50"
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value={sev}
                  checked={prefsData.defaultMinSeverity === sev}
                  onChange={(e) => setPrefsData({ ...prefsData, defaultMinSeverity: e.target.value })}
                  className="sr-only"
                />
                <div className="flex flex-col">
                  <span className="block text-sm font-semibold capitalize text-gray-900">{sev}</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {sev === "info" && "All suggestions, nitpicks, and styling issues."}
                    {sev === "warning" && "Potential bugs, logic errors, and bad practices."}
                    {sev === "error" && "Critical bugs, security issues, and crashes."}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium text-gray-900 block">Default AI Model</label>
          <p className="text-sm text-gray-500 mb-3">Choose the model that powers the automated code reviews.</p>
          <select
            value={prefsData.defaultModel}
            onChange={(e) => setPrefsData({ ...prefsData, defaultModel: e.target.value })}
            className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-200 focus:border-greenDark focus:ring-1 focus:ring-greenDark outline-none bg-white transition-all text-gray-700"
          >
            <option value="openai/gpt-oss-120b">GPT-OSS 120B (Recommended)</option>
            <option value="openai/gpt-oss-20b">GPT-OSS 20B (Faster)</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium text-gray-900 block">Active Triggers</label>
          <p className="text-sm text-gray-500 mb-3">Select which GitHub events should trigger HatMind to run.</p>
          <div className="space-y-3">
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
              prefsData.activeTriggers.includes("pr") ? "border-greenDark/40 bg-greenLight/5" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}>
              <input
                type="checkbox"
                checked={prefsData.activeTriggers.includes("pr")}
                onChange={() => toggleTrigger("pr")}
                className="w-5 h-5 text-greenDark rounded focus:ring-greenDark"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Pull Requests</div>
                <div className="text-sm text-gray-500">Run a full code review when a PR is opened or updated.</div>
              </div>
            </label>

            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
              prefsData.activeTriggers.includes("push") ? "border-greenDark/40 bg-greenLight/5" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}>
              <input
                type="checkbox"
                checked={prefsData.activeTriggers.includes("push")}
                onChange={() => toggleTrigger("push")}
                className="w-5 h-5 text-greenDark rounded focus:ring-greenDark"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Push to Main</div>
                <div className="text-sm text-gray-500">Keep the Pinecone semantic index up to date when code is merged.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isUpdatingPreferences}
            className="px-6 py-2.5 bg-greenDark text-cream rounded-xl font-medium hover:bg-greenLight transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdatingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Review Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewPrefsSection;
