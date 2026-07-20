import React, { useState } from "react";
import { useAuth } from "../../store/useAuthStore.js";
import { useSettingsStore } from "../../store/useSettingsStore.js";
import { Loader2 } from "lucide-react";

const NotificationsSection = () => {
  const { authUser, updateAuthUser } = useAuth();
  const { updateGlobalPreferences, isUpdatingPreferences } = useSettingsStore();

  const [prefsData, setPrefsData] = useState({
    reviewCompleted: authUser?.preferences?.notifications?.reviewCompleted || "in_app",
    findingsNeedAttention: authUser?.preferences?.notifications?.findingsNeedAttention || "in_app",
    emailDigest: authUser?.preferences?.notifications?.emailDigest || false
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateGlobalPreferences({ notifications: prefsData });
      updateAuthUser(updatedUser);
    } catch (error) {
      // Handled by store
    }
  };

  const NotificationOption = ({ label, description, name, value }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-gray-100 gap-4">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="shrink-0 flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
        <label className={`px-4 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${value === "in_app" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
          <input
            type="radio"
            name={name}
            value="in_app"
            checked={value === "in_app"}
            onChange={(e) => setPrefsData({ ...prefsData, [name]: e.target.value })}
            className="sr-only"
          />
          In App
        </label>
        <label className={`px-4 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${value === "email" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
          <input
            type="radio"
            name={name}
            value="email"
            checked={value === "email"}
            onChange={(e) => setPrefsData({ ...prefsData, [name]: e.target.value })}
            className="sr-only"
          />
          Email
        </label>
        <label className={`px-4 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${value === "none" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
          <input
            type="radio"
            name={name}
            value="none"
            checked={value === "none"}
            onChange={(e) => setPrefsData({ ...prefsData, [name]: e.target.value })}
            className="sr-only"
          />
          None
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-greenDark mb-1">Notification Preferences</h2>
        <p className="text-gray-500 mb-6">Choose how and when you want to be notified about code review activity.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-2">Real-time Alerts</h3>
            <div className="space-y-1">
              <NotificationOption
                label="Review Completed"
                description="When HatMind finishes analyzing a pull request."
                name="reviewCompleted"
                value={prefsData.reviewCompleted}
              />
              <NotificationOption
                label="Action Required"
                description="When a pull request review uncovers warnings or errors."
                name="findingsNeedAttention"
                value={prefsData.findingsNeedAttention}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-medium text-gray-900">Weekly Email Digest</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Receive a weekly summary of all PRs reviewed, most common issues, and codebase health trends.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={prefsData.emailDigest}
                  onChange={(e) => setPrefsData({ ...prefsData, emailDigest: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-greenDark"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isUpdatingPreferences}
            className="px-6 py-2.5 bg-greenDark text-cream rounded-xl font-medium hover:bg-greenLight transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdatingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Notification Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationsSection;
