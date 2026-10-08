
function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 font-bold">
        {title}
      </h2>

      <div className="space-y-5">
        {children}
      </div>
    </section>
  );
}

export default Card;
