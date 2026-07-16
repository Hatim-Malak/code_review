import { useEffect, useState } from "react";
import { useAuth } from "../store/useAuthStore.js";
import { useReviewStore } from "../store/useReviewStore.js";
import CustomNavbar from "../components/CustomNavbar.jsx";
import RepoCard from "../components/RepoCard.jsx";
import ReviewList from "../components/ReviewList.jsx";
import ReviewDetail from "../components/ReviewDetail.jsx";
import { Helmet } from "react-helmet-async";
import { GitPullRequest, ArrowLeft, Plus, GitMerge, FolderGit2, Search, ExternalLink, Activity, Box, ShieldAlert, CheckCircle, RefreshCw, XCircle, Sparkles } from "lucide-react";
import { axiosInstance } from "../lib/axios.js";

const ActivityIcon = ({ type }) => {
  switch (type) {
    case 'review_started': return <RefreshCw className="text-blue-500 animate-spin-slow" size={16} />;
    case 'review_completed': return <CheckCircle className="text-orange-500" size={16} />;
    case 'review_failed': return <XCircle className="text-red-500" size={16} />;
    case 'reindexed': return <Box className="text-purple-500" size={16} />;
    case 'pr_merged_clean': return <CheckCircle className="text-green-500" size={16} />;
    default: return <Activity className="text-gray-500" size={16} />;
  }
};

const SkeletonRepoList = () => (
  <div className="flex flex-col gap-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-greenDark/5 animate-pulse">
        <div className="w-9 h-9 rounded-lg bg-greenDark/10 flex-shrink-0"></div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 rounded bg-greenDark/10 w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [dashboardStats, setDashboardStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  useEffect(() => {
    loadRepos();
    
    // Fetch global stats and activities for the right sidebar
    const fetchDashboard = async () => {
      try {
        const res = await axiosInstance.get("/activity");
        setDashboardStats(res.data.stats);
        setActivities(res.data.activities);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, []);

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const cleanCount = reviews.filter(r => r.status === 'completed' && r.findingCount === 0).length;
  const attentionCount = reviews.filter(r => r.findingCount > 0).length;

  const getFilteredReviews = () => {
    if (statusFilter === "All") return reviews;
    if (statusFilter === "Clean") return reviews.filter(r => r.status === 'completed' && r.findingCount === 0);
    if (statusFilter === "Needs Attention") return reviews.filter(r => r.status === 'completed' && r.findingCount > 0);
    if (statusFilter === "In Progress") return reviews.filter(r => r.status === 'in_progress' || r.status === 'pending');
    return reviews;
  };

  const displayedReviews = getFilteredReviews();

  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  return (
    <div className="bg-cream flex flex-col h-screen w-full">
      <Helmet>
        <title>Reviews | HatMind AI</title>
        <meta name="description" content="View AI-powered code reviews for your GitHub pull requests." />
      </Helmet>
      <CustomNavbar logo="./HatMind.jpg" items={navItems} dashboardMode={true} />

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Panel - Repo List */}
          <div className="w-72 border-r border-greenDark/10 bg-white/30 overflow-auto p-4 pt-6 pb-6 hidden md:flex md:flex-col">
            {/* Logo inside sidebar for desktop */}
            <a href="/" className="flex items-center gap-2 mb-8 group px-1 cursor-pointer">
              <img 
                src="./HatMind.jpg" 
                alt="Logo" 
                className="h-10 w-auto rounded-xl object-contain shadow-sm transition-transform group-hover:scale-105" 
              />
              <span className="text-2xl font-black tracking-tighter text-greenDark">
                HatMind
              </span>
            </a>

            <div className="flex items-center justify-between mb-4 px-1">
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

            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-greenDark/40" />
              </div>
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/50 border border-greenDark/10 rounded-xl text-sm text-greenDark focus:outline-none focus:ring-2 focus:ring-greenLight/50 focus:bg-white transition-all placeholder:text-greenDark/40"
              />
            </div>

            {isLoadingRepos ? (
              <SkeletonRepoList />
            ) : repos.length === 0 ? (
              <p className="text-sm text-greenDark/60 px-2">
                No repositories connected.
              </p>
            ) : filteredRepos.length === 0 ? (
              <p className="text-sm text-greenDark/60 px-2">
                No repositories found matching "{searchQuery}".
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredRepos.map((repo) => (
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

          {/* Middle Panel - Content */}
          <div className="flex-1 overflow-auto p-6 pt-[100px] pb-8 bg-cream/50 relative border-r border-greenDark/10">
            {!selectedRepo ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="relative group max-w-lg w-full">
                  <div className="absolute inset-0 bg-greenLight/5 blur-3xl rounded-[3rem] group-hover:bg-greenLight/10 transition-colors duration-700"></div>
                  <div className="bg-white/60 p-12 rounded-[2.5rem] border border-greenDark/10 shadow-xl shadow-greenDark/5 flex flex-col items-center relative backdrop-blur-sm">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-greenLight/20 blur-xl rounded-full"></div>
                      <div className="bg-gradient-to-br from-white to-cream p-6 rounded-2xl shadow-lg border border-greenDark/5 relative transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        {repos.length === 0 ? (
                          <FolderGit2 size={56} className="text-greenDark/60" strokeWidth={1.5} />
                        ) : (
                          <GitMerge size={56} className="text-greenDark/60" strokeWidth={1.5} />
                        )}
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-greenDark mb-4 tracking-tight">
                      {repos.length === 0 ? "No Repositories Connected" : "Select a Repository"}
                    </h2>
                    <p className="text-base text-greenDark/70 mb-10 leading-relaxed font-medium">
                      {repos.length === 0 
                        ? "Connect your GitHub account to integrate your repositories and start viewing intelligent, AI-powered pull request reviews instantly." 
                        : "Choose a repository from the left panel to explore its automated pull request reviews and detailed AI findings."}
                    </p>
                    {repos.length === 0 && (
                      <a
                        href="https://github.com/apps/hatmind-rag/installations/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-greenDark text-cream font-bold rounded-2xl hover:bg-greenLight hover:text-white transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Plus size={22} strokeWidth={2.5} />
                        Connect Repository
                      </a>
                    )}
                  </div>
                </div>
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
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-greenDark">
                        {selectedRepo.owner}/{selectedRepo.name}
                      </h2>
                      <a 
                        href={`https://github.com/${selectedRepo.owner}/${selectedRepo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-greenDark/5 hover:bg-greenDark/10 text-greenDark/60 hover:text-greenDark rounded-lg transition-colors"
                        title="View on GitHub"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    
                    {!isLoadingReviews && reviews.length > 0 && (
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-greenDark/70 bg-white/50 px-2.5 py-1 rounded-md border border-greenDark/10">
                          <span className="w-2 h-2 rounded-full bg-greenLight"></span>
                          {cleanCount} Clean
                        </div>
                        <div className="flex items-center gap-1.5 text-greenDark/70 bg-white/50 px-2.5 py-1 rounded-md border border-greenDark/10">
                          <span className={`w-2 h-2 rounded-full ${attentionCount > 0 ? 'bg-red-500' : 'bg-greenDark/20'}`}></span>
                          {attentionCount} Need{attentionCount !== 1 ? 's' : ''} Attention
                        </div>
                        {selectedRepo.lastIndexedAt && (
                          <div className="text-greenDark/50 pl-2 border-l border-greenDark/10">
                            Indexed {timeAgo(selectedRepo.lastIndexedAt)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Status Filters */}
                    {!isLoadingReviews && reviews.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {["All", "Needs Attention", "Clean", "In Progress"].map(filter => (
                          <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === filter ? 'bg-greenDark text-cream' : 'bg-white/60 text-greenDark/60 hover:bg-white hover:text-greenDark border border-greenDark/10'}`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    )}
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
                  reviews={displayedReviews}
                  onSelect={loadReviewDetail}
                  isLoading={isLoadingReviews}
                />
              </div>
            )}
          </div>
          
          {/* Third Panel - Activity & Stats */}
          <div className="w-80 lg:w-96 bg-white/40 overflow-y-auto p-4 pt-[100px] pb-8 hidden xl:flex xl:flex-col gap-6">
            
            {/* Stats Grid */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-black text-greenDark uppercase tracking-widest flex items-center gap-2 mb-1">
                <Activity size={16} /> Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 border border-greenDark/10 p-3 rounded-xl shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-greenDark/60 uppercase tracking-wider">PRs This Week</p>
                  <p className="text-xl font-black text-greenDark">
                    {dashboardStats ? dashboardStats.reviewsThisWeek : "..."}
                  </p>
                </div>
                <div className="bg-white/70 border border-greenDark/10 p-3 rounded-xl shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-greenDark/60 uppercase tracking-wider">Repos Connected</p>
                  <p className="text-xl font-black text-greenDark">
                    {dashboardStats ? dashboardStats.totalRepos : "..."}
                  </p>
                </div>
                <div className="bg-white/70 border border-greenDark/10 p-3 rounded-xl shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-orange-600/70 uppercase tracking-wider">Attention Needed</p>
                  <p className="text-xl font-black text-orange-600">
                    {dashboardStats ? dashboardStats.attentionReviews : "..."}
                  </p>
                </div>
                <div className="bg-white/70 border border-greenDark/10 p-3 rounded-xl shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider">Merged Clean</p>
                  <p className="text-xl font-black text-green-600">
                    {dashboardStats ? dashboardStats.cleanReviews : "..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="flex flex-col gap-3 mt-4 flex-1">
              <h3 className="text-sm font-black text-greenDark uppercase tracking-widest flex items-center gap-2 mb-1">
                <Sparkles size={16} /> Recent Activity
              </h3>
              
              <div className="flex-1 flex flex-col gap-3">
                {isLoadingDashboard ? (
                  <div className="text-xs text-greenDark/50 text-center py-8 animate-pulse">Loading activity...</div>
                ) : activities.length === 0 ? (
                  <div className="text-xs text-greenDark/50 text-center py-8">No recent activity.</div>
                ) : (
                  activities.map(act => (
                    <div key={act._id} className="p-3 bg-white/70 border border-greenDark/5 rounded-xl shadow-sm flex gap-3 items-start hover:bg-white transition-colors">
                      <div className="mt-1 p-1.5 bg-greenLight/10 rounded-full shrink-0">
                        <ActivityIcon type={act.type} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-greenDark">{act.repoId?.owner}/{act.repoId?.name}</span>
                          {act.prNumber && (
                            <span className="px-1.5 py-0.5 bg-greenDark/5 text-greenDark/70 text-[10px] font-bold rounded-md">
                              PR #{act.prNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-greenDark/80 leading-snug">{act.message}</p>
                        <span className="text-[10px] font-semibold text-greenDark/40 mt-0.5">{timeAgo(act.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
