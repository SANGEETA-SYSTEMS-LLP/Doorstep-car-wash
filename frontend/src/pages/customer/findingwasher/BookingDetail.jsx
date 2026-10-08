
function BookingDetail({ icon, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-blue-600">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {text}
        </p>
      </div>
    </div>
  );
}

export default BookingDetail;
