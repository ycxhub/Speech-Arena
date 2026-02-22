import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin, isSuperAdmin } from "@/lib/lnl/roles";
import { redirect } from "next/navigation";
import { getTasks } from "./actions";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { TasksTable } from "@/components/lnl/admin/tasks-table";
import Link from "next/link";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) redirect("/listen-and-log");

  const superAdmin = await isSuperAdmin(user.id);
  const { data: tasks } = await getTasks();

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "Admin", href: "/listen-and-log/admin" },
          { label: "Task Management" },
        ]}
        actions={
          <Link href="/listen-and-log/admin/tasks/new">
            <LnlButton size="sm">+ New Task</LnlButton>
          </Link>
        }
      />
      <div className="p-6">
        <LnlCard padding="none">
          <TasksTable tasks={tasks} isSuperAdmin={superAdmin} />
        </LnlCard>
      </div>
    </>
  );
}
