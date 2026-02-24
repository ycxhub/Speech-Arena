import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import {
  getAssignedTasksForUser,
  getAllTasksForAdmin,
} from "./actions";
import { TaskList } from "@/components/lnl/dashboard/task-list";

export default async function ListenAndLogDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const isAdmin = await isLnlAdmin(user.id);
  const tasks = isAdmin
    ? await getAllTasksForAdmin(user.id)
    : await getAssignedTasksForUser(user.id);

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "My Tasks" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-xl font-semibold text-neutral-100">My Tasks</h1>
        <TaskList tasks={tasks} isAdmin={isAdmin} />
      </div>
    </>
  );
}
