import { Github } from "lucide-react";

const RepoCard = ({ repo, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-3 p-5 rounded-2xl transition-all duration-300 text-left shadow-sm w-full ${
        isSelected
          ? "bg-greenLight text-cream border border-greenLight shadow-md"
          : "bg-white/50 hover:bg-white border border-greenDark/10 hover:border-greenLight/50 hover:shadow-md"
      }`}
    >
      <div className={`p-2 rounded-xl ${
        isSelected ? "bg-cream/20" : "bg-cream border border-greenDark/10"
      }`}>
        <Github size={20} className={isSelected ? "text-cream" : "text-greenDark"} />
      </div>
      <div className="flex flex-col gap-1">
        <span className={`font-bold text-sm ${isSelected ? "text-cream" : "text-greenDark"}`}>
          {repo.owner}/{repo.name}
        </span>
      </div>
    </button>
  );
};

export default RepoCard;
