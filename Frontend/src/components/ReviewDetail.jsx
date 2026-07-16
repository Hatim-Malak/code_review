import { ArrowLeft, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import FindingCard from "./FindingCard.jsx";

const SkeletonReviewDetail = () => (
  <div className="flex flex-col gap-6 animate-pulse mt-2">
    <div className="w-28 h-5 bg-greenDark/10 rounded"></div>
    <div className="flex items-center justify-between">
      <div className="w-48 h-8 bg-greenDark/10 rounded"></div>
      <div className="w-24 h-6 bg-greenDark/10 rounded-full"></div>
    </div>
    <div className="flex flex-col gap-4">
      {[1, 2].map(i => (
        <div key={i} className="h-40 bg-white/40 border border-greenDark/5 rounded-2xl"></div>
      ))}
    </div>
  </div>
);

const ReviewDetail = ({ review, onBack, isLoading }) => {
  if (isLoading) {
    return <SkeletonReviewDetail />;
  }

  if (!review) return null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-greenDark/60 hover:text-greenDark transition-colors"
      >
        <ArrowLeft size={16} />
        Back to reviews
      </button>

      <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl border border-greenDark/10 shadow-sm mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-greenLight text-cream rounded-xl flex items-center justify-center font-black shadow-inner text-lg">
            #{review.prNumber}
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-greenDark tracking-tight">
              Code Review
            </h2>
            <span className="text-sm font-semibold text-greenDark/60 uppercase tracking-widest mt-0.5">
              Pull Request
            </span>
          </div>
        </div>
        <StatusBadge status={review.status} />
      </div>

      <div className="flex flex-col gap-4">
        {review.findings.length === 0 ? (
          review.status === 'failed' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-gradient-to-b from-red-50 to-white/30 border border-red-200/50 rounded-3xl shadow-sm mt-2">
              <div className="p-6 bg-red-100 rounded-full mb-6 shadow-inner border border-red-200 relative group">
                <AlertCircle size={56} className="text-red-500 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-black text-red-600 mb-3 tracking-tight">
                Review Failed
              </h3>
              <p className="text-[15px] text-red-700/70 max-w-md leading-relaxed font-medium">
                The AI encountered an error while analyzing this pull request. Please try again later or check the repository settings.
              </p>
            </div>
          ) : (review.status === 'in_progress' || review.status === 'pending') ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-gradient-to-b from-yellow-50 to-white/30 border border-yellow-200/50 rounded-3xl shadow-sm mt-2">
              <div className="p-6 bg-yellow-100 rounded-full mb-6 shadow-inner border border-yellow-200 relative group">
                <Loader2 size={56} className="text-yellow-600 relative z-10 animate-spin" />
              </div>
              <h3 className="text-2xl font-black text-yellow-700 mb-3 tracking-tight">
                Review in Progress...
              </h3>
              <p className="text-[15px] text-yellow-800/70 max-w-md leading-relaxed font-medium">
                The AI is currently analyzing your code. This usually takes a few moments. Hang tight!
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-gradient-to-b from-white/60 to-white/30 border border-greenDark/10 rounded-3xl shadow-sm mt-2">
              <div className="p-6 bg-greenLight/10 rounded-full mb-6 shadow-inner border border-greenLight/20 relative group">
                <div className="absolute inset-0 bg-greenLight/20 rounded-full animate-ping opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <ShieldCheck size={56} className="text-greenLight relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-black text-greenDark mb-3 tracking-tight">
                Flawless Code!
              </h3>
              <p className="text-[15px] text-greenDark/70 max-w-md leading-relaxed font-medium">
                The AI didn't find any issues in this pull request. Everything looks perfectly structured and ready to merge. Great job!
              </p>
            </div>
          )
        ) : (
          review.findings.map((finding, idx) => (
            <FindingCard key={idx} finding={finding} />
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewDetail;
