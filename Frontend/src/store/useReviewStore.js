import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const useReviewStore = create((set, get) => ({
  repos: [],
  selectedRepo: null,
  reviews: [],
  selectedReview: null,
  isLoadingRepos: false,
  isLoadingReviews: false,
  isLoadingReviewDetail: false,
  
  dashboardStats: null,
  activities: [],
  isLoadingDashboard: true,
  
  // Indexing progress state — always visible, shows overall repo indexing status
  indexingStatus: { total: 0, indexed: 0, progress: 0, isActive: false },
  socket: null,

  fetchIndexingStatus: async () => {
    try {
      const res = await axiosInstance.get("/repos/indexing-status");
      const { total, indexed, progress } = res.data;
      set({ indexingStatus: { total, indexed, progress, isActive: indexed < total } });
    } catch (error) {
      console.error("Error fetching indexing status:", error);
    }
  },

  fetchDashboard: async () => {
    try {
      set({ isLoadingDashboard: true });
      const res = await axiosInstance.get("/activity");
      set({ dashboardStats: res.data.stats, activities: res.data.activities });
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      set({ isLoadingDashboard: false });
    }
  },

  connectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) return;

    const socket = io("http://localhost:5000", { withCredentials: true });
    
    socket.on("connect", () => {
      console.log("ReviewStore Socket connected:", socket.id);
    });

    socket.on("indexingProgress", (data) => {
      console.log("indexingProgress event received:", data);
      // When any indexing event fires, re-fetch the real status from the API
      get().fetchIndexingStatus();
      if (data.status === "completed") {
        toast.success("Repository indexed successfully!");
      } else if (data.status === "failed") {
        toast.error("Repository indexing failed.");
      }
    });

    socket.on("dashboardUpdate", (data) => {
      console.log("dashboardUpdate event received:", data);
      get().loadRepos();
      get().fetchDashboard();
      get().loadReviews();
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  loadRepos: async () => {
    try {
      set({ isLoadingRepos: true });
      const res = await axiosInstance.get("/repos");
      set({ repos: res.data });
    } catch (error) {
      console.error("Error loading repos:", error);
      toast.error("Failed to load repositories");
    } finally {
      set({ isLoadingRepos: false });
    }
  },

  selectRepo: (repo) => {
    set({ selectedRepo: repo, reviews: [], selectedReview: null });
    get().loadReviews();
  },

  loadReviews: async () => {
    const { selectedRepo } = get();
    if (!selectedRepo) return;
    
    try {
      set({ isLoadingReviews: true });
      const res = await axiosInstance.get(`/repos/${selectedRepo.owner}/${selectedRepo.name}/prs`);
      set({ reviews: res.data });
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      set({ isLoadingReviews: false });
    }
  },

  loadReviewDetail: async (prNumber) => {
    const { selectedRepo } = get();
    if (!selectedRepo) return;
    
    try {
      set({ isLoadingReviewDetail: true });
      const res = await axiosInstance.get(`/repos/${selectedRepo.owner}/${selectedRepo.name}/pr/${prNumber}`);
      set({ selectedReview: res.data });
    } catch (error) {
      console.error("Error loading review detail:", error);
      toast.error("Failed to load review details");
    } finally {
      set({ isLoadingReviewDetail: false });
    }
  },

  toggleFindingResolve: async (findingId, resolved) => {
    const { selectedRepo, selectedReview } = get();
    if (!selectedRepo || !selectedReview || !findingId) return;

    try {
      // Optimistic update for the review detail
      const prevReview = { ...selectedReview };
      const updatedFindings = selectedReview.findings.map(f => 
        f._id === findingId ? { ...f, resolved } : f
      );
      set({ selectedReview: { ...selectedReview, findings: updatedFindings } });

      // Optimistic update for the repo card red dot
      const { repos } = get();
      const updatedRepos = repos.map(r => {
        if (r._id === selectedRepo._id) {
          // If we resolved it, decrement, if we unresolved it, increment
          return { ...r, attentionCount: Math.max(0, r.attentionCount + (resolved ? -1 : 1)) };
        }
        return r;
      });
      set({ repos: updatedRepos });

      await axiosInstance.patch(`/repos/${selectedRepo.owner}/${selectedRepo.name}/pr/${selectedReview.prNumber}/finding/${findingId}`, {
        resolved
      });
      toast.success(resolved ? "Finding marked as resolved" : "Finding marked as unresolved");
    } catch (error) {
      console.error("Error toggling finding resolve:", error);
      toast.error("Failed to update finding status");
      // Could revert optimistic update here if desired
    }
  },

  reRunReview: async (prNumber) => {
    const { selectedRepo } = get();
    if (!selectedRepo) return;

    try {
      // Optimistically update list and detail status
      const { reviews, selectedReview } = get();
      if (reviews) {
        set({ reviews: reviews.map(r => r.prNumber === prNumber ? { ...r, status: 'in_progress' } : r) });
      }
      if (selectedReview && selectedReview.prNumber === prNumber) {
        set({ selectedReview: { ...selectedReview, status: 'in_progress' } });
      }

      await axiosInstance.post(`/repos/${selectedRepo.owner}/${selectedRepo.name}/pr/${prNumber}/rerun`);
      toast.success("Review job re-queued");
    } catch (error) {
      console.error("Error re-running review:", error);
      toast.error("Failed to re-run review");
    }
  },

  clearSelection: () => {
    set({ selectedRepo: null, reviews: [], selectedReview: null });
  },

  clearReviewDetail: () => {
    set({ selectedReview: null });
  }
}));
