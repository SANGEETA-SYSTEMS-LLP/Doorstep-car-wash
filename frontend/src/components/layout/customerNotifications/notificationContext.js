import { createContext } from "react";

export const NotificationContext = createContext(null);
export const MAX_NOTIFICATIONS = 30;
export function sortNotifications(notifications) {
  return [...notifications].sort((first, second) => new Date(second.created_at) - new Date(first.created_at)).slice(0, MAX_NOTIFICATIONS);
}