import React, { useEffect, useState } from "react";
import { useReviewStore } from "../../store/useReviewStore.js";
import { useSettingsStore } from "../../store/useSettingsStore.js";
import { FolderGit2, Loader2, Unlink, Trash2, Settings2, X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios.js";

const ReposSection = () => {
  const { repos, loadRepos, isLoadingRepos } = useReviewStore();
  const { disconnectRepo, isDisconnectingRepo, updateRepoPreferences, isUpdatingRepoPreferences } = useSettingsStore();

  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [prefsData, setPrefsData] = useState({
    minSeverity: "info",
    activeTriggers: ["pr", "push"],
    model: "llama-3.3-70b-versatile"
  });

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  const openPrefs = (repo) => {
    setSelectedRepo(repo);
    const prefs = repo.reviewPreferences || {};
    setPrefsData({
      minSeverity: prefs.minSeverity || "info",
      activeTriggers: prefs.activeTriggers || ["pr", "push"],
      model: prefs.model || "llama-3.3-70b-versatile"
    });
  };

  const handleUpdatePrefs = async (e) => {
    e.preventDefault();
    if (!selectedRepo) return;
    try {
      await updateRepoPreferences(selectedRepo.owner, selectedRepo.name, prefsData);
      setSelectedRepo(null);
      loadRepos(); // refresh to show updated data
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDisconnect = async (repo) => {
    if (!window.confirm(`Are you sure you want to stop reviewing ${repo.name}?`)) return;
    try {
      await disconnectRepo(repo.owner, repo.name);
      loadRepos();
    } catch (error) {
      // Error handled by store
    }
  };

  const handleUninstall = async (repo) => {
    if (!window.confirm(`WARNING: This will completely uninstall HatMind from ${repo.owner}/${repo.name} on GitHub. Are you sure?`)) return;
    setIsUninstalling(true);
    try {
      await axiosInstance.delete(`/repos/${repo.owner}/${repo.name}/uninstall`);
      toast.success("App uninstalled from repository");
      loadRepos();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to uninstall app");
    } finally {
      setIsUninstalling(false);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-greenDark mb-1">Connected Repositories</h2>
        <p className="text-gray-500 mb-6">Manage repositories that HatMind is currently reviewing.</p>
      </div>

      {isLoadingRepos ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-greenDark animate-spin" />
        </div>
      ) : repos.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-greenLight/20 rounded-xl bg-white/50">
          <FolderGit2 className="w-12 h-12 text-greenLight mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-greenDark mb-2">No Repositories Claimed</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Install the HatMind GitHub App on your repositories, then link the installation here to start reviewing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {repos.map((repo) => (
            <div key={repo._id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white rounded-xl border border-greenDark/10 shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-cream flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-6 h-6 text-greenDark" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-lg">{repo.owner} / {repo.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${repo.lastIndexedAt ? "bg-green-500" : "bg-gray-300"}`} />
                      {repo.lastIndexedAt ? "Indexed" : "Pending Index"}
                    </span>
                    {repo.reviewPreferences?.model && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs">Custom Prefs</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => openPrefs(repo)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Repo Preferences"
                >
                  <Settings2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDisconnect(repo)}
                  disabled={isDisconnectingRepo}
                  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Stop Reviewing (Unclaim)"
                >
                  <Unlink className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleUninstall(repo)}
                  disabled={isUninstalling}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Fully Uninstall from GitHub"
                >
                  {isUninstalling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRepo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-greenLight/20 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-greenDark">
                Preferences: {selectedRepo.name}
              </h3>
              <button
                onClick={() => setSelectedRepo(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePrefs} className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Minimum Severity to Report</label>
                <select
                  value={prefsData.minSeverity}
                  onChange={(e) => setPrefsData({ ...prefsData, minSeverity: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-greenDark focus:ring-1 focus:ring-greenDark outline-none bg-white transition-all text-gray-700"
                >
                  <option value="info">Info & Above (Verbose)</option>
                  <option value="warning">Warning & Above (Standard)</option>
                  <option value="error">Error Only (Critical issues)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">AI Model</label>
                <select
                  value={prefsData.model}
                  onChange={(e) => setPrefsData({ ...prefsData, model: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-greenDark focus:ring-1 focus:ring-greenDark outline-none bg-white transition-all text-gray-700"
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Active Triggers</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={prefsData.activeTriggers.includes("pr")}
                      onChange={() => toggleTrigger("pr")}
                      className="w-4 h-4 text-greenDark rounded focus:ring-greenDark"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">Pull Requests</div>
                      <div className="text-xs text-gray-500">Review all new and updated PRs</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={prefsData.activeTriggers.includes("push")}
                      onChange={() => toggleTrigger("push")}
                      className="w-4 h-4 text-greenDark rounded focus:ring-greenDark"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">Push to Main</div>
                      <div className="text-xs text-gray-500">Incrementally index codebase on push</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRepo(null)}
                  className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRepoPreferences}
                  className="px-5 py-2 bg-greenDark text-cream font-medium rounded-xl hover:bg-greenLight transition-colors flex items-center gap-2"
                >
                  {isUpdatingRepoPreferences && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReposSection;
