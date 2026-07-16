import { AlertTriangle, Info, XCircle, FileCode2, Terminal } from "lucide-react";

const severityConfig = {
  error: {
    style: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle size={14} className="mr-1.5" />,
    label: "Error"
  },
  warning: {
    style: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <AlertTriangle size={14} className="mr-1.5" />,
    label: "Warning"
  },
  info: {
    style: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Info size={14} className="mr-1.5" />,
    label: "Info"
  },
};

const FindingCard = ({ finding }) => {
  const config = severityConfig[finding.severity] || severityConfig.info;

  return (
    <div className="group bg-white/80 hover:bg-white border border-greenDark/10 hover:border-greenDark/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-2">
      {/* Header section */}
      <div className="flex items-start justify-between gap-4 p-4 md:p-5 border-b border-greenDark/5 bg-gradient-to-r from-cream/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl border border-greenDark/5 shadow-sm group-hover:shadow transition-shadow">
            <FileCode2 size={20} className="text-greenDark/70" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm md:text-base font-bold text-greenDark break-all tracking-tight">
              {finding.file}
            </span>
            <span className="text-xs font-semibold text-greenDark/50 mt-0.5 uppercase tracking-wider">
              Lines {finding.startLine} – {finding.endLine}
            </span>
          </div>
        </div>
        <div className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm ${config.style}`}>
          {config.icon}
          {config.label}
        </div>
      </div>
      
      {/* Comment section */}
      <div className="p-4 md:p-5">
        <p className="text-[15px] md:text-base text-greenDark/90 leading-relaxed font-medium">
          {finding.comment}
        </p>
      </div>
      
      {/* Suggested Fix section */}
      {finding.suggestedFix && (
        <div className="mx-4 md:mx-5 mb-5 rounded-xl overflow-hidden border border-greenDark/90 shadow-md">
          <div className="flex items-center bg-greenDark px-4 py-2 border-b border-white/10">
            <Terminal size={14} className="text-cream/70 mr-2" />
            <span className="text-xs font-bold text-cream/80 uppercase tracking-widest">
              Suggested Fix
            </span>
          </div>
          <div className="bg-[#1a1f1c] p-4 overflow-x-auto">
            <pre className="text-sm md:text-[15px] text-cream/90 font-mono whitespace-pre-wrap leading-relaxed">
              {finding.suggestedFix}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindingCard;
