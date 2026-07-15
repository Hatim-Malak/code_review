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

  clearSelection: () => {
    set({ selectedRepo: null, reviews: [], selectedReview: null });
  },

  clearReviewDetail: () => {
    set({ selectedReview: null });
  }
}));
