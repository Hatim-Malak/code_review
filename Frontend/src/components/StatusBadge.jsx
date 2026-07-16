import { CheckCircle2, Loader2, XCircle, Clock, AlertTriangle, AlertCircle } from "lucide-react";

const StatusBadge = ({ status }) => {
  const config = {
    clean: {
      style: "bg-greenLight/10 text-greenLight border-greenLight/20",
      icon: <CheckCircle2 size={12} className="mr-1.5" />,
      label: "clean"
    },
    needs_attention: {
      style: "bg-orange-100 text-orange-700 border-orange-200",
      icon: <AlertTriangle size={12} className="mr-1.5" />,
      label: "needs attention"
    },
    errors_found: {
      style: "bg-red-100 text-red-700 border-red-200",
      icon: <AlertCircle size={12} className="mr-1.5" />,
      label: "errors found"
    },
    in_progress: {
      style: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Loader2 size={12} className="mr-1.5 animate-spin" />,
      label: "reviewing…"
    },
    pending: {
      style: "bg-gray-100 text-gray-600 border-gray-200",
      icon: <Clock size={12} className="mr-1.5" />,
      label: "pending"
    },
    failed: {
      style: "bg-red-100 text-red-600 border-red-200",
      icon: <XCircle size={12} className="mr-1.5" />,
      label: "failed"
    },
  };

  const currentConfig = config[status] || config.pending;

  return (
    <span className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border ${currentConfig.style}`}>
      {currentConfig.icon}
      {currentConfig.label}
    </span>
  );
};

export default StatusBadge;
