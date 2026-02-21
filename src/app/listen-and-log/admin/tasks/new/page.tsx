import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { redirect } from "next/navigation";
import { getLnlUsers } from "../../users/actions";
import { TaskCreationWizard } from "@/components/lnl/admin/task-creation-wizard";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";

export default async function NewTaskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) redirect("/listen-and-log");

  const { data: users } = await getLnlUsers();

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "Admin", href: "/listen-and-log/admin" },
          { label: "Tasks", href: "/listen-and-log/admin/tasks" },
          { label: "New Task" },
        ]}
      />
      <div className="p-6">
        <TaskCreationWizard
          availableUsers={(users ?? []).map((u) => ({
            user_id: u.user_id,
            email: u.email,
            role: u.role,
          }))}
        />
      </div>
    </>
  );
}
