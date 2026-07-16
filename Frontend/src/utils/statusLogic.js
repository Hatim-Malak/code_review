export const getDisplayStatus = (status, severityBreakdown) => {
  if (status === "failed") return "failed";
  if (status === "pending") return "pending";
  if (status === "in_progress") return "in_progress";

  if (status === "completed") {
    if (!severityBreakdown) return "clean"; // Fallback if no findings processed
    
    if (severityBreakdown.error > 0) {
      return "errors_found";
    }
    
    if (severityBreakdown.warning > 0 || severityBreakdown.info > 0) {
      return "needs_attention";
    }

    return "clean";
  }

  return status;
};
