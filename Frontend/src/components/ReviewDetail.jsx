import { ArrowLeft } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import FindingCard from "./FindingCard.jsx";

const ReviewDetail = ({ review, onBack, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-greenDark/10 border-t-greenLight rounded-full animate-spin" />
      </div>
    );
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

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-greenDark">
          PR #{review.prNumber} Review
        </h2>
        <StatusBadge status={review.status} />
      </div>

      <div className="flex flex-col gap-4">
        {review.findings.length === 0 ? (
          <div className="text-center py-8 text-greenDark/60">
            <p>No findings in this review.</p>
          </div>
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
