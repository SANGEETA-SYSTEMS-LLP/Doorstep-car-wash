function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-gray-500">{label}</p>
        <p className="mt-0.5 break-words font-medium text-gray-900">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}

export default InfoRow;
