import React, { useEffect } from "react";
import { useSettingsStore } from "../../store/useSettingsStore.js";
import { Github, Unlink, Loader2, Plus } from "lucide-react";
import { useAuth } from "../../store/useAuthStore.js";

const GitHubSection = () => {
  const { authUser } = useAuth();
  const { githubConnections, fetchGithubConnections, disconnectInstallation, isDisconnectingInstallation } = useSettingsStore();

  useEffect(() => {
    fetchGithubConnections();
  }, [fetchGithubConnections]);

  const handleConnect = () => {
    // Standard GitHub App installation URL pattern
    window.location.href = `https://github.com/apps/hatmind-rag/installations/new?state=${authUser?._id}`;
    console.log(authUser)
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-greenDark mb-1">GitHub Connection</h2>
        <p className="text-gray-500 mb-6">Manage your linked GitHub App installations.</p>
      </div>

      {githubConnections.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-greenLight/20 rounded-xl bg-white/50">
          <Github className="w-12 h-12 text-greenLight mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-greenDark mb-2">No GitHub Connections</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect HatMind to your GitHub account or organization to start reviewing pull requests.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-greenDark text-cream rounded-lg font-medium hover:bg-greenLight transition-colors"
          >
            <Plus className="w-5 h-5" />
            Connect GitHub
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {githubConnections.map((conn) => (
            <div key={conn._id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-greenDark/10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Github className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{conn.accountLogin}</h4>
                  <p className="text-sm text-gray-500 capitalize">{conn.accountType} Account • ID: {conn.installationId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => disconnectInstallation(conn.installationId)}
                  disabled={isDisconnectingInstallation}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Disconnect Installation"
                >
                  {isDisconnectingInstallation ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Unlink className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
          
          <button
            onClick={handleConnect}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-greenLight/10 text-greenDark rounded-lg font-medium hover:bg-greenLight/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Connect Another Account
          </button>
        </div>
      )}
    </div>
  );
};

export default GitHubSection;
