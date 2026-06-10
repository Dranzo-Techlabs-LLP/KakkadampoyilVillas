import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return (
    <AdminShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        roleName: user.roleName,
        permissions: user.permissions,
      }}
    >
      {children}
    </AdminShell>
  );
}
