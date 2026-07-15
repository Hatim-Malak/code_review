import { useEffect, useState } from "react";
import { useAuth } from "../store/useAuthStore.js";
import { useReviewStore } from "../store/useReviewStore.js";
import CustomNavbar from "../components/CustomNavbar.jsx";
import RepoCard from "../components/RepoCard.jsx";
import ReviewList from "../components/ReviewList.jsx";
import ReviewDetail from "../components/ReviewDetail.jsx";
import { Helmet } from "react-helmet-async";
import { GitPullRequest, ArrowLeft, Plus } from "lucide-react";

const ReviewsPage = () => {
  const { authUser, logout } = useAuth();
  const {
    repos,
    selectedRepo,
    reviews,
    selectedReview,
    isLoadingRepos,
    isLoadingReviews,
    isLoadingReviewDetail,
    loadRepos,
    selectRepo,
    loadReviewDetail,
    clearSelection,
    clearReviewDetail,
  } = useReviewStore();

  useEffect(() => {
    loadRepos();
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    ...(authUser
      ? [
          { label: "Chat", href: "/chat" },
          { label: "Reviews", href: "/reviews" },
          { label: "Logout", href: "#", onClick: logout },
        ]
      : [
          { label: "Login", href: "/login" },
          { label: "Sign Up", href: "/signup" },
        ]),
  ];

  return (
    <div className="bg-cream flex flex-col h-screen w-full">
      <Helmet>
        <title>Reviews | HatMind AI</title>
        <meta name="description" content="View AI-powered code reviews for your GitHub pull requests." />
      </Helmet>
      <CustomNavbar logo="./HatMind.jpg" items={navItems} />

      <div className="flex-1 overflow-hidden pt-[80px]">
        <div className="h-full flex">
          {/* Left Panel - Repo List */}
          <div className="w-80 border-r border-greenDark/10 bg-white/30 overflow-auto p-4 hidden md:block">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-black text-greenDark">
                Repositories
              </h2>
              <a
                href="https://github.com/apps/hatmind-rag/installations/new"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-greenDark/10 hover:bg-greenDark/20 text-greenDark rounded-xl transition-colors"
                title="Connect Repository"
              >
                <Plus size={18} />
              </a>
            </div>
            {isLoadingRepos ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-greenDark/10 border-t-greenLight rounded-full animate-spin" />
              </div>
            ) : repos.length === 0 ? (
              <p className="text-sm text-greenDark/60 px-2">
                No repositories connected.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {repos.map((repo) => (
                  <RepoCard
                    key={repo._id}
                    repo={repo}
                    isSelected={selectedRepo?._id === repo._id}
                    onClick={() => selectRepo(repo)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Content */}
          <div className="flex-1 overflow-auto p-6">
            {!selectedRepo ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <GitPullRequest size={48} className="text-greenDark/20 mb-4" />
                <h2 className="text-2xl font-black text-greenDark mb-2">
                  {repos.length === 0 ? "No Repositories Connected" : "Select a Repository"}
                </h2>
                <p className="text-greenDark/60 max-w-md mb-6">
                  {repos.length === 0 
                    ? "Connect a repository to start viewing AI-powered pull request reviews." 
                    : "Choose a repository from the left panel to view its pull request reviews."}
                </p>
                {repos.length === 0 && (
                  <a
                    href="https://github.com/apps/hatmind-rag/installations/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-greenDark text-cream font-bold rounded-xl hover:bg-greenLight transition-colors flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Connect Repository
                  </a>
                )}
              </div>
            ) : selectedReview ? (
              <ReviewDetail
                review={selectedReview}
                onBack={clearReviewDetail}
                isLoading={isLoadingReviewDetail}
              />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-greenDark">
                      {selectedRepo.owner}/{selectedRepo.name}
                    </h2>
                    <p className="text-sm text-greenDark/60 mt-1">
                      Pull Request Reviews
                    </p>
                  </div>
                  <button
                    onClick={clearSelection}
                    className="md:hidden flex items-center gap-2 text-sm text-greenDark/60 hover:text-greenDark"
                  >
                    <ArrowLeft size={16} />
                    All repos
                  </button>
                </div>
                <ReviewList
                  reviews={reviews}
                  onSelect={loadReviewDetail}
                  isLoading={isLoadingReviews}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
