// Shared presentation for the important-activity notifications feed — used by both
// the topbar bell (quick view) and the Notifications page (full detail).
import {
  BadgeCheck,
  Bell,
  Bike,
  FileText,
  MessageSquare,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import type { NotificationRow } from "@/api";

export interface NotificationMeta {
  icon: LucideIcon;
  label: string;
  subject: string;
  /** In-app link to the record (or its module), when one exists. */
  href: string | null;
}

/** Map an important create event to an icon, headline, subject, and link. */
export function describeNotification(n: NotificationRow): NotificationMeta {
  switch (n.collection) {
    case "sp.sanggunian.documents":
      return {
        icon: FileText,
        label: "New document filed",
        subject: n.ref ? `${n.ref} — ${n.title ?? ""}` : n.title ?? "",
        href: n.docId ? `/documents/${n.docId}` : null,
      };
    case "sp.sanggunian.sessions":
      return { icon: Presentation, label: "Session created", subject: n.title ?? "", href: "/sessions" };
    case "sp.mtop.applications":
      return {
        icon: Bike,
        label: "New franchise application",
        subject: [n.ref, n.applicantName].filter(Boolean).join(" · "),
        href: "/prangkisa",
      };
    case "sp.mtop.mtops":
      return { icon: BadgeCheck, label: "MTOP issued", subject: n.ref ?? "", href: "/prangkisa" };
    case "sp.portal.feedback":
      return { icon: MessageSquare, label: "New citizen feedback", subject: n.title ?? "", href: null };
    default:
      return { icon: Bell, label: "Activity", subject: n.title ?? n.ref ?? "", href: null };
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function formatFullTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
