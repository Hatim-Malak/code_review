import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useReviewStore = create((set, get) => ({
  repos: [],
  selectedRepo: null,
  reviews: [],
  selectedReview: null,
  isLoadingRepos: false,
  isLoadingReviews: false,
  isLoadingReviewDetail: false,

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
      // Optimistic update
      const prevReview = { ...selectedReview };
      const updatedFindings = selectedReview.findings.map(f => 
        f._id === findingId ? { ...f, resolved } : f
      );
      set({ selectedReview: { ...selectedReview, findings: updatedFindings } });

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
