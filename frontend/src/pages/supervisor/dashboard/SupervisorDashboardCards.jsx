import { BriefcaseBusiness, CircleCheckBig, CircleDollarSign, TriangleAlert } from "lucide-react";

function SupervisorDashboardCards({ stats }) {
  const cards = [
    { title: "Active Jobs", value: stats.activeJobs, icon: BriefcaseBusiness },
    { title: "Escalations", value: stats.escalations, icon: TriangleAlert },
    { title: "Extra Charges", value: stats.pendingExtraCharges, icon: CircleDollarSign },
    { title: "Completed Today", value: stats.completedToday, icon: CircleCheckBig },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, icon: Icon }) => (
        <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-3 text-green-600">
              <Icon size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SupervisorDashboardCards;
