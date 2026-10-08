import {
  ArrowDownLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Wallet,
} from "lucide-react";

const transactions = [
  {
    id: "CW-2026-1028",
    service: "Premium Wash",
    date: "08 Oct 2026",
    earning: 350,
    status: "Pending",
  },
  {
    id: "CW-2026-1022",
    service: "Basic Wash",
    date: "08 Oct 2026",
    earning: 210,
    status: "Settled",
  },
  {
    id: "CW-2026-1015",
    service: "Premium Wash",
    date: "08 Oct 2026",
    earning: 350,
    status: "Settled",
  },
  {
    id: "CW-2026-0995",
    service: "Complete Detailing",
    date: "07 Oct 2026",
    earning: 1050,
    status: "Settled",
  },
];

function WasherEarnings() {
  return (
    <div className="p-5 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Earnings
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          My Earnings
        </h1>

        <p className="mt-2 text-slate-500">
          Track your completed services, earnings and
          settlements.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EarningCard
            icon={<Banknote />}
            label="Today"
            value="₹1,420"
            text="4 jobs"
          />

          <EarningCard
            icon={<TrendingUp />}
            label="This Week"
            value="₹7,850"
            text="21 jobs"
          />

          <EarningCard
            icon={<CalendarDays />}
            label="This Month"
            value="₹28,650"
            text="72 jobs"
          />

          <EarningCard
            icon={<Wallet />}
            label="Pending Settlement"
            value="₹2,450"
            text="Next settlement"
          />
        </div>

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold">
              Recent Earnings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Earnings from your latest completed jobs.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.map(
              (transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <ArrowDownLeft size={19} />
                    </div>

                    <div>
                      <p className="font-bold">
                        {transaction.service}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.id} •{" "}
                        {transaction.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +₹
                        {transaction.earning}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Washer earning
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        transaction.status
                      }
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function EarningCard({
  icon,
  label,
  value,
  text,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {text}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "Settled") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
        <CheckCircle2 size={13} />
        Settled
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
      <Clock3 size={13} />
      Pending
    </span>
  );
}

export default WasherEarnings;