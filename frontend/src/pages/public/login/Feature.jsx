
function Feature({ icon, title, text }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
        {icon}
      </div>

      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-blue-100">
          {text}
        </p>
      </div>
    </div>
  );
}

export default Feature;
