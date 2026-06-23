import {
  LayoutDashboard,
  Search,
  ScanLine,
  Presentation,
  GitBranch,
  Bike,
  BarChart3,
  Bell,
  ShieldCheck,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  /** Short label for the sidebar. */
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Reachable by route (and topbar title) but NOT shown in the sidebar rail. */
  hidden?: boolean;
}

/** The four core modules + the dashboard, in sidebar order. */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Executive Dashboard",
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Real-time metrics across documents, sessions, and committees.",
  },
  {
    title: "Smart Search & E-Library",
    label: "E-Library",
    href: "/search",
    icon: Search,
    description:
      "OCR-powered full-text search across digital and scanned legislative records.",
  },
  {
    title: "Scan & Digitize",
    label: "Scan",
    href: "/scan",
    icon: ScanLine,
    description:
      "Scan a paper with OCR to create a searchable digital copy.",
  },
  {
    title: "Paperless Session Dashboard",
    label: "Sessions",
    href: "/sessions",
    icon: Presentation,
    description:
      "Live order of business, in-session document viewer, and hybrid sessions.",
  },
  {
    title: "Legislative Tracking & Workflow",
    label: "Tracking",
    href: "/tracking",
    icon: GitBranch,
    description:
      "Pipeline status of pending measures, committee hubs, and voting records.",
  },
  {
    title: "Tricycle Franchising & MTOP",
    label: "Franchising",
    href: "/prangkisa",
    icon: Bike,
    description:
      "Prangkisa — tricycle franchise (MTOP) applications, inspection, payment, SB action, and QR-verifiable digital permits.",
  },
  {
    title: "Data Analytics & Secretariat Reports",
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description:
      "Productivity metrics, document processing throughput, and reports.",
  },
  {
    // Reached only via the topbar bell's "View all notifications" link — never
    // shown as a sidebar tab.
    title: "Notifications",
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    description:
      "Important activity across the apps — new documents, sessions, franchise applications, MTOPs, and citizen feedback.",
    hidden: true,
  },
  {
    title: "Accounts",
    label: "Accounts",
    href: "/accounts",
    icon: Users,
    description:
      "Manage user accounts — create, edit, and remove sign-in credentials and assign each account a role.",
  },
  {
    title: "Roles",
    label: "Roles",
    href: "/roles",
    icon: ShieldCheck,
    description:
      "Define the roles a user account can hold and the access each role grants.",
  },
  {
    title: "Activity Logs",
    label: "Activity Logs",
    href: "/logs",
    icon: ScrollText,
    description:
      "Tamper-evident audit trail of every action across the system — sign-ins, record changes, and administration.",
  },
];

/** Resolve the nav item that owns a given pathname (longest matching href wins). */
export function activeNavItem(pathname: string): NavItem {
  const match = [...NAV_ITEMS]
    .filter((item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ?? NAV_ITEMS[0];
}
