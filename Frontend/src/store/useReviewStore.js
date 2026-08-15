import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const useReviewStore = create((set, get) => ({
  repos: [],
  reposLastFetched: 0,
  
  selectedRepo: null,
  
  // Keyed cache for reviews
  reviewsByRepoId: {}, 
  reviewsLastFetched: {},
  reviewsPageByRepoId: {},
  hasMoreReviewsByRepoId: {},
  
  selectedReview: null,
  
  isLoadingRepos: false,
  isLoadingReviews: false,
  isLoadingReviewDetail: false,
  isLoadingDashboard: false,
  isMergingPR: false,
  
  dashboardStats: null,
  dashboardStatsLastFetched: 0,
  activities: [],
  isLoadingDashboard: true,
  
  // Indexing progress state
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

  fetchDashboard: async ({ force = false } = {}) => {
    if (!force && Date.now() - get().dashboardStatsLastFetched < 3 * 60 * 1000) return;
    
    try {
      set({ isLoadingDashboard: true });
      const res = await axiosInstance.get("/activity");
      set({ 
        dashboardStats: res.data.stats, 
        activities: res.data.activities,
        dashboardStatsLastFetched: Date.now()
      });
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      set({ isLoadingDashboard: false });
    }
  },

  connectSocket: (userId) => {
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) return;

    const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "https://hatmind.duckdns.org";
    const socket = io(backendUrl, { withCredentials: true });
    
    socket.on("connect", () => {
      console.log("ReviewStore Socket connected:", socket.id);
      if (userId) {
        socket.emit("joinUserRoom", userId);
      }
    });

    let lastIndexingFetch = 0;
    socket.on("indexingProgress", (data) => {
      console.log("indexingProgress event received:", data);
      
      // Throttle to at most once per second
      if (Date.now() - lastIndexingFetch > 1000) {
          lastIndexingFetch = Date.now();
          get().fetchIndexingStatus();
      }
      
      if (data.status === "completed") {
        toast.success("Repository indexed successfully!");
      } else if (data.status === "failed") {
        toast.error("Repository indexing failed.");
      }
    });

    let dashboardUpdateTimeout = null;
    let pendingUpdates = new Set();

    socket.on("dashboardUpdate", (data) => {
      console.log("dashboardUpdate event received:", data);
      
      if (data?.type) pendingUpdates.add(data.type);
      else pendingUpdates.add("unknown");
      
      if (dashboardUpdateTimeout) clearTimeout(dashboardUpdateTimeout);
      
      dashboardUpdateTimeout = setTimeout(() => {
        const types = new Set(pendingUpdates);
        pendingUpdates.clear();
        
        const tasks = [];
        
        const needsRepoUpdate = types.has("unknown") || types.has("github_webhook") || types.has("index_completed") || types.has("index_failed");
        const needsDashboardUpdate = types.has("unknown") || types.has("github_webhook") || types.has("review_completed");
        const needsReviewUpdate = types.has("unknown") || types.has("review_started") || types.has("review_completed");
        
        if (needsRepoUpdate) {
            tasks.push(get().loadRepos({ force: true }));
        }
        
        if (needsDashboardUpdate) {
            tasks.push(get().fetchDashboard({ force: true }));
        }
        
        if (needsReviewUpdate) {
            set({ reviewsLastFetched: {} });
            const selectedRepo = get().selectedRepo;
            if (selectedRepo) {
                const repoKey = `${selectedRepo.owner}/${selectedRepo.name}`;
                tasks.push(get().loadReviews(repoKey, 1, { force: true }));
                
                const selectedReview = get().selectedReview;
                if (selectedReview) {
                    tasks.push(get().loadReviewDetail(selectedReview.prNumber));
                }
            }
        }
        
        if (tasks.length > 0) {
            Promise.allSettled(tasks);
        }
      }, 500);
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

  loadRepos: async ({ force = false } = {}) => {
    if (!force && Date.now() - get().reposLastFetched < 3 * 60 * 1000) return;
    
    try {
      set({ isLoadingRepos: true });
      const res = await axiosInstance.get("/repos");
      set({ repos: res.data, reposLastFetched: Date.now() });
    } catch (error) {
      console.error("Error loading repos:", error);
      toast.error("Failed to load repositories");
    } finally {
      set({ isLoadingRepos: false });
    }
  },

  selectRepo: (repo) => {
    set({ selectedRepo: repo, selectedReview: null });
    const repoKey = `${repo.owner}/${repo.name}`;
    get().loadReviews(repoKey, 1);
  },

  loadReviews: async (repoKey, page = 1, { force = false } = {}) => {
    if (!repoKey) return;
    
    const { reviewsLastFetched } = get();
    
    if (!force && page === 1 && reviewsLastFetched[repoKey] && (Date.now() - reviewsLastFetched[repoKey] < 3 * 60 * 1000)) {
        return; // Use cached data
    }
    
    try {
      set({ isLoadingReviews: true });
      const [owner, name] = repoKey.split("/");
      const res = await axiosInstance.get(`/repos/${owner}/${name}/prs?page=${page}&limit=20`);
      
      set((state) => ({ 
        reviewsByRepoId: {
            ...state.reviewsByRepoId,
            [repoKey]: page === 1 ? res.data : [...(state.reviewsByRepoId[repoKey] || []), ...res.data]
        },
        reviewsPageByRepoId: {
            ...state.reviewsPageByRepoId,
            [repoKey]: page
        },
        hasMoreReviewsByRepoId: {
            ...state.hasMoreReviewsByRepoId,
            [repoKey]: res.data.length === 20
        },
        reviewsLastFetched: {
            ...state.reviewsLastFetched,
            [repoKey]: Date.now()
        }
      }));
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
      const prevReview = { ...selectedReview };
      const updatedFindings = selectedReview.findings.map(f => 
        f._id === findingId ? { ...f, resolved } : f
      );
      set({ selectedReview: { ...selectedReview, findings: updatedFindings } });

      const { repos } = get();
      const updatedRepos = repos.map(r => {
        if (r._id === selectedRepo._id) {
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
    }
  },

  reRunReview: async (prNumber) => {
    const { selectedRepo, reviewsByRepoId } = get();
    if (!selectedRepo) return;
    
    const repoKey = `${selectedRepo.owner}/${selectedRepo.name}`;

    try {
      const reviews = reviewsByRepoId[repoKey];
      const { selectedReview } = get();
      
      if (reviews) {
        set((state) => ({
            reviewsByRepoId: {
                ...state.reviewsByRepoId,
                [repoKey]: reviews.map(r => r.prNumber === prNumber ? { ...r, status: 'in_progress' } : r)
            }
        }));
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

  mergePR: async (prNumber, override = false) => {
    const { selectedRepo } = get();
    if (!selectedRepo) return;
    
    try {
      set({ isMergingPR: true });
      await axiosInstance.post(`/repos/${selectedRepo.owner}/${selectedRepo.name}/pr/${prNumber}/merge`, { override });
      toast.success("PR merged successfully");
      
      const { selectedReview } = get();
      if (selectedReview && selectedReview.prNumber === prNumber) {
        set({ selectedReview: { ...selectedReview, status: "merged" } });
      }
      
      const repoKey = `${selectedRepo.owner}/${selectedRepo.name}`;
      const { reviewsByRepoId } = get();
      if (reviewsByRepoId[repoKey]) {
        set({
          reviewsByRepoId: {
            ...reviewsByRepoId,
            [repoKey]: reviewsByRepoId[repoKey].map(r => r.prNumber === prNumber ? { ...r, status: "merged" } : r)
          }
        });
      }
    } catch (error) {
      console.error("Error merging PR:", error);
      toast.error(error.response?.data?.message || "Failed to merge PR");
    } finally {
      set({ isMergingPR: false });
    }
  },

  clearSelection: () => {
    set({ selectedRepo: null, selectedReview: null });
  },

  clearReviewDetail: () => {
    set({ selectedReview: null });
  }
}));
