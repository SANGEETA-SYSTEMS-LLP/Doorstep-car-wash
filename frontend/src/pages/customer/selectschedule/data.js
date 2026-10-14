export const times = ["08:00 AM", "09:00 AM", "10:00 AM", "10:30 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
const timezone = "Asia/Kolkata";
export function scheduleDates(now = Date.now(), count = 30) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = type => parts.find(p => p.type === type).value;
  const today = part("year") + "-" + part("month") + "-" + part("day");
  const start = Date.parse(today + "T12:00:00+05:30");
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start + index * 86400000);
    const iso = new Date(date.getTime() + 19800000).toISOString().slice(0, 10);
    return { id: iso, iso, day: new Intl.DateTimeFormat("en-IN", { timeZone: timezone, weekday: "short" }).format(date), date: iso.slice(8), month: new Intl.DateTimeFormat("en-IN", { timeZone: timezone, month: "short" }).format(date), year: iso.slice(0, 4), today: index === 0 };
  });
}
export function slotInstant(iso, time) {
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "") || !match || Number(match[1]) < 1 || Number(match[1]) > 12 || Number(match[2]) > 59) return NaN;
  const hour = Number(match[1]) % 12 + (match[3] === "PM" ? 12 : 0);
  return Date.parse(iso + "T" + String(hour).padStart(2, "0") + ":" + match[2] + ":00+05:30");
}
export function canSelectSlot(iso, time, now = Date.now()) {
  return times.includes(time) && scheduleDates(now).some(day => day.iso === iso) && slotInstant(iso, time) > now;
}
