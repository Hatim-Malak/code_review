import React, { useState } from "react";
import { useSettingsStore } from "../../store/useSettingsStore.js";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";

const DangerZoneSection = () => {
  const { deleteAccount, isDeletingAccount } = useSettingsStore();
  
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmText !== "DELETE MY ACCOUNT") return;
    
    try {
      await deleteAccount(password);
      // Let the auth store or layout handle redirect via token invalidation,
      // but we can also manually reload to clear all state:
      window.location.href = "/login";
    } catch (error) {
      // Error handled by store (toast)
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-red-600 mb-1 flex items-center gap-2">
          Danger Zone
        </h2>
        <p className="text-gray-500 mb-6">Irreversible, destructive actions for your account.</p>
      </div>

      <div className="border border-red-200 rounded-xl overflow-hidden bg-white">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
          <p className="text-gray-500 mb-6 max-w-2xl text-sm">
            Once you delete your account, there is no going back. Please be certain.
            Deleting your account will:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600 mb-6 space-y-1">
            <li>Permanently delete your profile and preferences</li>
            <li>Disconnect all linked GitHub App installations</li>
            <li>Unclaim all repositories you've connected</li>
            <li>Permanently delete all your AI chat history</li>
          </ul>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg font-medium transition-colors focus:ring-4 focus:ring-red-100"
          >
            Delete Account...
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border-t-4 border-t-red-600 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 pb-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Are you absolutely sure?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. This will permanently delete your user account and all associated personal data. 
                Repository review history will be preserved but detached from your identity.
              </p>
            </div>
            
            <form onSubmit={handleDelete} className="p-6 pt-0 space-y-4 bg-gray-50/50 border-t border-gray-100 mt-6 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Please type <strong>DELETE MY ACCOUNT</strong> to confirm.
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Confirm your password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPassword("");
                    setConfirmText("");
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount || confirmText !== "DELETE MY ACCOUNT" || !password}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete everything
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZoneSection;
