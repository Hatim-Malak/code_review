import { useState } from "react";
import { AlertTriangle, Info, XCircle, FileCode2, Terminal, Code2, ChevronDown, ChevronUp, CheckSquare, Square, Copy, Check, Database } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

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

const FindingCard = ({ finding, onToggleResolve }) => {
  const [showDiff, setShowDiff] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(finding.suggestedFix);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const config = severityConfig[finding.severity] || severityConfig.info;

  return (
    <div className={`group bg-white/80 hover:bg-white border hover:border-greenDark/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-2 ${finding.resolved ? 'border-greenDark/5 opacity-70' : 'border-greenDark/10'}`}>
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
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onToggleResolve(finding._id, !finding.resolved)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${finding.resolved ? 'bg-greenDark text-cream border-greenDark' : 'bg-white text-greenDark/60 border-greenDark/10 hover:bg-greenDark/5'}`}
          >
            {finding.resolved ? <CheckSquare size={14} /> : <Square size={14} />}
            {finding.resolved ? "Resolved" : "Mark Resolved"}
          </button>
          
          {!finding.resolved && (
            <div className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm ${config.style}`}>
              {config.icon}
              {config.label}
            </div>
          )}
        </div>
      </div>
      
      {/* Comment section */}
      <div className={`p-4 md:p-5 ${finding.resolved ? 'line-through text-greenDark/40' : 'text-greenDark/90'}`}>
        <div className="prose prose-sm md:prose-base prose-green max-w-none font-medium leading-relaxed">
          <ReactMarkdown>{finding.comment}</ReactMarkdown>
        </div>
      </div>
      
      {/* Suggested Fix section */}
      {finding.suggestedFix && (
        <div className="mx-4 md:mx-5 mb-5 rounded-xl overflow-hidden border border-greenDark/90 shadow-md">
          <div className="flex items-center justify-between bg-greenDark px-4 py-2 border-b border-white/10">
            <div className="flex items-center">
              <Terminal size={14} className="text-cream/70 mr-2" />
              <span className="text-xs font-bold text-cream/80 uppercase tracking-widest">
                Suggested Fix
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-cream/80 hover:text-cream transition-colors text-[10px] font-bold uppercase tracking-wider"
            >
              {isCopied ? <Check size={12} /> : <Copy size={12} />}
              {isCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="bg-[#1a1f1c] overflow-x-auto text-sm md:text-[15px]">
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
              wrapLongLines={true}
            >
              {finding.suggestedFix}
            </SyntaxHighlighter>
          </div>
        </div>
      )}

      {/* Diff Context section */}
      {finding.hunkText && !finding.resolved && (
        <div className="mx-4 md:mx-5 mb-5 rounded-xl border border-greenDark/10 overflow-hidden">
          <button 
            onClick={() => setShowDiff(!showDiff)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-greenDark/5 hover:bg-greenDark/10 transition-colors text-greenDark"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Code2 size={16} className="text-greenDark/70" />
              Diff Context
            </div>
            {showDiff ? <ChevronUp size={16} className="text-greenDark/60" /> : <ChevronDown size={16} className="text-greenDark/60" />}
          </button>
          
          {showDiff && (
            <div className="bg-[#1a1f1c] overflow-x-auto border-t border-greenDark/10 text-sm md:text-[14px]">
              <SyntaxHighlighter
                language="diff"
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                wrapLongLines={true}
              >
                {finding.hunkText}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}

      {/* RAG Sources section */}
      {finding.rag_sources && finding.rag_sources.length > 0 && !finding.resolved && (
        <div className="mx-4 md:mx-5 mb-5 rounded-xl border border-greenDark/10 overflow-hidden">
          <button 
            onClick={() => setShowSources(!showSources)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-greenDark/5 hover:bg-greenDark/10 transition-colors text-greenDark"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Database size={16} className="text-greenDark/70" />
              AI Context Used
            </div>
            {showSources ? <ChevronUp size={16} className="text-greenDark/60" /> : <ChevronDown size={16} className="text-greenDark/60" />}
          </button>
          
          {showSources && (
            <div className="bg-white/50 p-4 border-t border-greenDark/10">
              <ul className="list-disc pl-5 space-y-1">
                {finding.rag_sources.map((source, idx) => (
                  <li key={idx} className="text-sm text-greenDark/80 font-mono break-all">
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindingCard;
