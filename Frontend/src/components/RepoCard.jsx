import { Github } from "lucide-react";
import { useRef } from "react";
import { useReviewStore } from "../store/useReviewStore.js";

const RepoCard = ({ repo, isSelected, onClick }) => {
  const loadReviews = useReviewStore(state => state.loadReviews);
  const hoverTimeout = useRef(null);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      const repoKey = `${repo.owner}/${repo.name}`;
      loadReviews(repoKey, 1);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex items-center justify-between gap-2 p-3 rounded-xl transition-all duration-300 text-left shadow-sm w-full ${
        isSelected
          ? "bg-greenLight text-cream border border-greenLight shadow-md"
          : "bg-white/50 hover:bg-white border border-greenDark/10 hover:border-greenLight/50 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isSelected ? "bg-cream/20" : "bg-cream border border-greenDark/10"
        }`}>
          <Github size={18} className={isSelected ? "text-cream" : "text-greenDark"} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className={`font-bold text-sm truncate ${isSelected ? "text-cream" : "text-greenDark"}`}>
            {repo.owner}/{repo.name}
          </span>
        </div>
      </div>
      {repo.attentionCount > 0 && (
        <div className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isSelected ? "bg-red-500 text-cream shadow-sm" : "bg-red-100 text-red-600 border border-red-200"
        }`}>
          {repo.attentionCount}
        </div>
      )}
    </button>
  );
};

export default RepoCard;
