import { signOutAction } from "@/app/actions";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/creators", label: "Creators" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/videos", label: "Videos" },
  { href: "/weekly-payouts", label: "Weekly Payouts" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ userEmail }: { userEmail: string }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <p className="eyebrow">Accounting Portal</p>
        <h1>Weekly Creator Payouts</h1>
        <p className="sidebar-copy">YouTube Shorts is the source of truth for every payout run.</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link key={item.href} className="sidebar-link" href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-user">{userEmail}</p>
        <form action={signOutAction}>
          <button className="button button-secondary button-full" type="submit">
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
