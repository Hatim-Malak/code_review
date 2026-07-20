import React, { useState } from "react";
import AccountSection from "../components/settings/AccountSection.jsx";
import GitHubSection from "../components/settings/GitHubSection.jsx";
import ReposSection from "../components/settings/ReposSection.jsx";
import ReviewPrefsSection from "../components/settings/ReviewPrefsSection.jsx";
import NotificationsSection from "../components/settings/NotificationsSection.jsx";
import ChatPrefsSection from "../components/settings/ChatPrefsSection.jsx";
import DangerZoneSection from "../components/settings/DangerZoneSection.jsx";
import { User, Github, FolderGit2, ShieldCheck, Bell, MessageSquare, AlertTriangle } from "lucide-react";
import CustomNavbar from "../components/CustomNavbar.jsx";
import { useAuth } from "../store/useAuthStore.js";

const SettingsPage = () => {
  const { authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    ...(authUser
      ? [
          { label: "Chat", href: "/chat" },
          { label: "Reviews", href: "/reviews" },
          { label: "Settings", href: "/settings" },
          { label: "Logout", href: "#", onClick: logout },
        ]
      : [
          { label: "Login", href: "/login" },
          { label: "Sign Up", href: "/signup" },
        ]),
  ];

  const tabs = [
    { id: "account", label: "Account Profile", icon: User },
    { id: "github", label: "GitHub Connection", icon: Github },
    { id: "repos", label: "Connected Repositories", icon: FolderGit2 },
    { id: "review", label: "Review Preferences", icon: ShieldCheck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "chat", label: "Chat Preferences", icon: MessageSquare },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "account": return <AccountSection />;
      case "github": return <GitHubSection />;
      case "repos": return <ReposSection />;
      case "review": return <ReviewPrefsSection />;
      case "notifications": return <NotificationsSection />;
      case "chat": return <ChatPrefsSection />;
      case "danger": return <DangerZoneSection />;
      default: return <AccountSection />;
    }
  };

  return (
    <>
    <CustomNavbar logo="./HatMind.jpg" items={navItems} />
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-greenDark mb-8">Settings</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? tab.danger
                          ? "bg-red-50 text-red-600 font-medium"
                          : "bg-greenLight/10 text-greenDark font-medium"
                        : "text-gray-600 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive && tab.danger ? "text-red-500" : ""}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-greenDark/10 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
    </>
  );
};

export default SettingsPage;
