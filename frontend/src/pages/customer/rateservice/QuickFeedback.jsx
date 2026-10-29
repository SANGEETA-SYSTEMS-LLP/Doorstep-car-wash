const FEEDBACK_ITEMS = [
  "On time",
  "Professional",
  "Great cleaning",
  "Polite",
  "Good communication",
  "Value for money",
];

function QuickFeedback() {
  return (
    <div className="mt-8">
      <p className="text-sm font-bold">What did you like?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEDBACK_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-green-500 hover:bg-green-50 hover:text-green-600"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickFeedback;
