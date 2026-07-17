import { Inbox } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { getDisplayStatus } from "../utils/statusLogic.js";

const SkeletonReviewList = () => (
  <div className="flex flex-col gap-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-white/40 border border-greenDark/5 rounded-2xl animate-pulse">
        <div className="flex flex-col gap-2 w-1/3">
          <div className="h-4 bg-greenDark/10 rounded w-full"></div>
          <div className="h-3 bg-greenDark/10 rounded w-2/3"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-greenDark/10 rounded-full"></div>
        </div>
      </div>
    ))}
  </div>
);

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

const ReviewList = ({ reviews, onSelect, isLoading, hasMore, onLoadMore }) => {
  if (isLoading && reviews.length === 0) {
    return <SkeletonReviewList />;
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-gradient-to-br from-white/70 to-cream/20 border border-greenDark/10 rounded-3xl shadow-sm mt-4">
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-greenLight/20 blur-xl rounded-full group-hover:bg-greenLight/30 transition-colors duration-500"></div>
          <div className="p-6 bg-white rounded-2xl shadow-md border border-greenDark/5 relative transform group-hover:-translate-y-1 transition-transform duration-300">
            <Inbox size={48} className="text-greenDark/40" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-2xl font-black text-greenDark mb-3 tracking-tight">No Reviews Found</h3>
        <p className="text-base text-greenDark/60 max-w-md leading-relaxed font-medium">
          There are currently no pull request reviews for this repository. Open a new pull request in your repository to trigger an AI review!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => (
        <button
          key={review.prNumber}
          onClick={() => onSelect(review.prNumber)}
          className="flex items-center justify-between p-4 bg-white/60 hover:bg-white border border-greenDark/10 hover:border-greenLight/50 rounded-2xl transition-all duration-300 text-left shadow-sm hover:shadow-md"
        >
          <div className="flex flex-col gap-2 overflow-hidden w-3/4">
            <span className="font-bold text-greenDark text-[15px] truncate pr-4">
              {review.prTitle || `Pull Request #${review.prNumber}`}
            </span>
            <div className="flex items-center gap-2 text-xs text-greenDark/60 flex-wrap">
              <span className="font-mono bg-cream/70 px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-greenDark/5">
                #{review.prNumber}
              </span>
              {review.prAuthor && (
                <div className="flex items-center gap-1.5 ml-0.5">
                  <img src={review.prAuthor.avatarUrl} alt={review.prAuthor.name} className="w-4 h-4 rounded-full bg-greenDark/10 border border-greenDark/5" />
                  <span className="font-medium text-greenDark/80">{review.prAuthor.name}</span>
                </div>
              )}
              {review.createdAt && (
                <>
                  <span className="text-greenDark/30">•</span>
                  <span>opened {timeAgo(review.createdAt)}</span>
                </>
              )}
            </div>
            
            <div className="flex gap-2 mt-1">
              {review.severityBreakdown ? (
                <>
                  {review.severityBreakdown.error > 0 && <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">{review.severityBreakdown.error} Error{review.severityBreakdown.error > 1 ? 's' : ''}</span>}
                  {review.severityBreakdown.warning > 0 && <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">{review.severityBreakdown.warning} Warning{review.severityBreakdown.warning > 1 ? 's' : ''}</span>}
                  {review.severityBreakdown.info > 0 && <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{review.severityBreakdown.info} Info</span>}
                  {review.severityBreakdown.error === 0 && review.severityBreakdown.warning === 0 && review.severityBreakdown.info === 0 && review.status === 'completed' && (
                    <span className="text-[10px] font-bold text-greenLight bg-greenLight/10 px-2 py-0.5 rounded-md border border-greenLight/20">Clean</span>
                  )}
                </>
              ) : (
                <span className="text-greenDark/60 text-xs">
                  {review.findingCount} finding{review.findingCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <StatusBadge status={getDisplayStatus(review.status, review.severityBreakdown)} />
          </div>
        </button>
      ))}
      
      {hasMore && reviews.length > 0 && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-4 p-3 w-full bg-greenDark/5 hover:bg-greenDark/10 text-greenDark/80 font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default ReviewList;
