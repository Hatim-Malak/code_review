const FindingCard = ({ finding }) => {
  const severityStyles = {
    error: "bg-red-100 text-red-600 border-red-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    info: "bg-blue-100 text-blue-600 border-blue-200",
  };

  return (
    <div className="p-4 bg-white/50 border border-greenDark/10 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm text-greenDark font-medium">
            {finding.file}
          </span>
          <span className="text-xs text-greenDark/60">
            Lines {finding.startLine}–{finding.endLine}
          </span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${severityStyles[finding.severity]}`}>
          {finding.severity}
        </span>
      </div>
      
      <p className="text-sm text-greenDark leading-relaxed mb-3">
        {finding.comment}
      </p>
      
      {finding.suggestedFix && (
        <div className="p-3 bg-cream/50 rounded-xl border border-greenDark/10">
          <span className="text-xs font-bold text-greenDark/70 uppercase tracking-wider block mb-2">
            Suggested Fix
          </span>
          <pre className="text-sm text-greenDark font-mono whitespace-pre-wrap">
            {finding.suggestedFix}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FindingCard;
