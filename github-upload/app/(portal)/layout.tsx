import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <Sidebar userEmail={user.email ?? "Admin"} />
      <main className="app-main">{children}</main>
    </div>
  );
}
