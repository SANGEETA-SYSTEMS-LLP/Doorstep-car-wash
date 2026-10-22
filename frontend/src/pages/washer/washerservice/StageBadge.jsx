
function StageBadge({ stage }) {
  const labels = {
    before: "Before Photos",
    service: "In Service",
    after: "After Photos",
    completed: "Completed",
  };

  return (
    <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
      {labels[stage]}
    </span>
  );
}

export default StageBadge;
