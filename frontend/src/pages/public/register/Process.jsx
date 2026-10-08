
function Process({ number, text }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
        {number}
      </div>

      <p className="font-medium">{text}</p>
    </div>
  );
}

export default Process;
