import { ArrowDownLeft, CheckCircle2, Clock3 } from "lucide-react";

const transactions = [
  { id: "CW-2026-1028", service: "Premium Wash", date: "08 Oct 2026", earning: 350, status: "Pending" },
  { id: "CW-2026-1022", service: "Basic Wash", date: "08 Oct 2026", earning: 210, status: "Settled" },
  { id: "CW-2026-1015", service: "Premium Wash", date: "08 Oct 2026", earning: 350, status: "Settled" },
  { id: "CW-2026-0995", service: "Complete Detailing", date: "07 Oct 2026", earning: 1050, status: "Settled" },
];

function RecentEarnings() {
  return (
    <section className="mt-7 rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-xl font-bold">Recent Earnings</h2>
        <p className="mt-1 text-sm text-slate-500">Earnings from your latest completed jobs.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <ArrowDownLeft size={19} />
              </div>
              <div>
                <p className="font-bold">{transaction.service}</p>
                <p className="mt-1 text-sm text-slate-500">{transaction.id} • {transaction.date}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">+₹{transaction.earning}</p>
                <p className="mt-1 text-xs text-slate-400">Washer earning</p>
              </div>
              <StatusBadge status={transaction.status} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const settled = status === "Settled";
  const Icon = settled ? CheckCircle2 : Clock3;
  return (
    <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${
      settled ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
    }`}>
      <Icon size={13} />
      {settled ? "Settled" : "Pending"}
    </span>
  );
}

export default RecentEarnings;
