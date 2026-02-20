import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { redirect } from "next/navigation";
import { getInvitations, getLnlUsers } from "./actions";
import { InviteUserForm } from "@/components/lnl/admin/invite-user-form";
import { InvitationsTable } from "@/components/lnl/admin/invitations-table";
import { UsersTable } from "@/components/lnl/admin/users-table";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import { LnlCard } from "@/components/lnl/ui/lnl-card";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");
  const authorized = await isLnlAdmin(user.id);
  if (!authorized) redirect("/listen-and-log");

  const [{ data: invitations }, { data: users }] = await Promise.all([
    getInvitations(),
    getLnlUsers(),
  ]);

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "Admin", href: "/listen-and-log/admin" },
          { label: "Users & Invitations" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <InviteUserForm />

        <LnlCard padding="none">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-100">
              Current Users ({(users ?? []).length})
            </h2>
          </div>
          <UsersTable users={users ?? []} />
        </LnlCard>

        <LnlCard padding="none">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-100">
              Invitations ({(invitations ?? []).length})
            </h2>
          </div>
          <InvitationsTable invitations={invitations ?? []} />
        </LnlCard>
      </div>
    </>
  );
}
