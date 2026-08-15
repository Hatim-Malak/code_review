import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      githubConnections: [],
      isUpdatingProfile: false,
      isUpdatingPreferences: false,
      isDisconnectingInstallation: false,
      isDisconnectingRepo: false,
      isUpdatingRepoPreferences: false,
      isChangingPassword: false,
      isDeletingAccount: false,

      updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.patch("/settings/profile", data);
          toast.success("Profile updated successfully");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update profile");
          throw error;
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      changePassword: async (data) => {
        set({ isChangingPassword: true });
        try {
          await axiosInstance.patch("/auth/change-password", data);
          toast.success("Password updated successfully");
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update password");
          throw error;
        } finally {
          set({ isChangingPassword: false });
        }
      },

      updateGlobalPreferences: async (data) => {
        set({ isUpdatingPreferences: true });
        try {
          const res = await axiosInstance.patch("/settings/preferences", data);
          toast.success("Preferences updated");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update preferences");
          throw error;
        } finally {
          set({ isUpdatingPreferences: false });
        }
      },

      fetchGithubConnections: async () => {
        try {
          const res = await axiosInstance.get("/settings/github");
          set({ githubConnections: res.data });
        } catch (error) {
          console.error("Failed to fetch github connections:", error);
          toast.error(error.response?.data?.message || "Failed to load GitHub connections");
        }
      },

      disconnectInstallation: async (installationId) => {
        set({ isDisconnectingInstallation: true });
        try {
          await axiosInstance.post(`/settings/github/disconnect/${installationId}`);
          toast.success("GitHub installation disconnected");
          set((state) => ({
            githubConnections: state.githubConnections.filter((i) => i.installationId !== installationId),
          }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to disconnect installation");
        } finally {
          set({ isDisconnectingInstallation: true });
        }
      },

      disconnectRepo: async (owner, repoName) => {
        set({ isDisconnectingRepo: true });
        try {
          await axiosInstance.post(`/settings/repos/${owner}/${repoName}/disconnect`);
          toast.success("Repository disconnected");
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to disconnect repo");
          throw error;
        } finally {
          set({ isDisconnectingRepo: false });
        }
      },

      updateRepoPreferences: async (owner, repoName, data) => {
        set({ isUpdatingRepoPreferences: true });
        try {
          const res = await axiosInstance.patch(`/settings/repos/${owner}/${repoName}/preferences`, data);
          toast.success("Repository preferences updated");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update repo preferences");
          throw error;
        } finally {
          set({ isUpdatingRepoPreferences: false });
        }
      },

      deleteAccount: async (password) => {
        set({ isDeletingAccount: true });
        try {
          await axiosInstance.delete("/auth/delete-account", { data: { password } });
          toast.success("Account deleted successfully");
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete account");
          throw error;
        } finally {
          set({ isDeletingAccount: false });
        }
      },
    }),
    {
      name: 'settings-storage',
      // only persist githubConnections to quickly render settings page connections
      partialize: (state) => ({ githubConnections: state.githubConnections }),
    }
  )
);
