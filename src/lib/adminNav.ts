// Sidebar navigation — each item gated by a permission key.
export interface NavItem {
  href: string;
  label: string;
  icon: string; // lucide icon name
  perm: string;
}

export const NAV: NavItem[] = [
  { href: "/admin",            label: "Dashboard",  icon: "LayoutDashboard", perm: "dashboard.view" },
  { href: "/admin/calendar",   label: "Calendar",   icon: "Calendar",        perm: "calendar.view" },
  { href: "/admin/bookings",   label: "Bookings",   icon: "BookMarked",      perm: "bookings.view" },
  { href: "/admin/accounting", label: "Accounting", icon: "Wallet",          perm: "accounting.view" },
  { href: "/admin/expenses",   label: "Expenses",   icon: "Receipt",         perm: "expenses.view" },
  { href: "/admin/reports",    label: "Reports",    icon: "FileBarChart",    perm: "reports.view" },
  { href: "/admin/villas",     label: "Villas",     icon: "Home",            perm: "villas.view" },
  { href: "/admin/users",      label: "Users",      icon: "Users",           perm: "users.view" },
  { href: "/admin/roles",      label: "Roles & Rights", icon: "ShieldCheck", perm: "users.view" },
];
