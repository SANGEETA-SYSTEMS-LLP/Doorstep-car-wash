export function ProfileCard({ title, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="font-bold">{title}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Info({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="text-blue-600">{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
