import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "received":
      return "bg-blue-500";
    case "under_review":
      return "bg-yellow-500";
    case "investigating":
      return "bg-orange-500";
    case "action_taken":
      return "bg-purple-500";
    case "closed":
      return "bg-green-500";
    case "rejected":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};
