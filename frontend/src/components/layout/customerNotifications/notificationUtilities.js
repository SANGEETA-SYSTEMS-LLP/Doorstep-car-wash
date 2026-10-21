export function showDesktopNotification(notification) {
  if (typeof window === "undefined" || !("Notification" in window) || window.Notification.permission !== "granted") return;
  try {
    new window.Notification(notification.title, { body: notification.message, tag: notification.id });
  } catch (error) {
    console.error("Unable to display desktop notification:", error);
  }
}

export async function requestDesktopNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    await window.Notification.requestPermission();
  } catch (error) {
    console.error("Unable to request desktop notification permission:", error);
  }
}

export function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
