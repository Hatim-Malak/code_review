import StatusBadge from "./StatusBadge.jsx";

const ReviewList = ({ reviews, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-greenDark/10 border-t-greenLight rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-greenDark/60">
        <p>No reviews found for this repository.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => (
        <button
          key={review.prNumber}
          onClick={() => onSelect(review.prNumber)}
          className="flex items-center justify-between p-4 bg-white/50 hover:bg-white border border-greenDark/10 hover:border-greenLight/50 rounded-2xl transition-all duration-300 text-left shadow-sm hover:shadow-md"
        >
          <div className="flex flex-col gap-1">
            <span className="font-bold text-greenDark text-sm">
              PR #{review.prNumber}
            </span>
            <span className="text-greenDark/60 text-xs">
              {review.findingCount} finding{review.findingCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {review.hasBlocking && (
              <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                Blocking
              </span>
            )}
            <StatusBadge status={review.status} />
          </div>
        </button>
      ))}
    </div>
  );
};

export default ReviewList;
