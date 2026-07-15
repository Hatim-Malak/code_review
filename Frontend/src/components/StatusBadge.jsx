const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-greenLight/10 text-greenLight border-greenLight/20",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
    pending: "bg-gray-100 text-gray-600 border-gray-200",
    failed: "bg-red-100 text-red-600 border-red-200",
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${styles[status] || styles.pending}`}>
      {status.replace("_", " ")}
    </span>
  );
};

export default StatusBadge;
