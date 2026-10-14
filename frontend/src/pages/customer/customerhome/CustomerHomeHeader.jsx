import { Bell } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function getDashboardTimeDetails() {
  const now = new Date();
  const hour = now.getHours();

  return {
    greeting:
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening",
    formattedDate: new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now),
  };
}

function CustomerHomeHeader() {
  const { user, profile } = useAuth();
  const { greeting, formattedDate } = getDashboardTimeDetails();
  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";
  const firstName = fullName.trim().split(/\s+/)[0];
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      <div>
        <p className="text-sm text-slate-500">{formattedDate}</p>
        <h1 className="text-xl font-bold">{greeting}, {firstName} 👋</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
          {initials}
        </div>
      </div>
    </header>
  );
}

export default CustomerHomeHeader;
