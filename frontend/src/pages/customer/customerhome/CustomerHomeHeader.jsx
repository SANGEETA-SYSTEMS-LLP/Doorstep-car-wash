import { useAuth } from "../../../context/AuthContext";
import { CustomerNotificationBell } from "../../../components/layout/CustomerBookingNotifications";

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
    <header className="flex h-20 items-center justify-between border-b border-[#dce8df] bg-white px-6 lg:px-8">
      <div>
        <p className="text-sm text-slate-500">{formattedDate}</p>
        <h1 className="text-xl font-bold">{greeting}, {firstName} 👋</h1>
      </div>
      <div className="flex items-center gap-4">
        <CustomerNotificationBell />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9eee1] font-bold text-[#1d6244]">
          {initials}
        </div>
      </div>
    </header>
  );
}

export default CustomerHomeHeader;
