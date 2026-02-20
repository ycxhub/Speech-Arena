import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { redirect } from "next/navigation";
import { getTasks } from "../tasks/actions";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) redirect("/listen-and-log");

  const result = await getTasks();
  const tasks = result.data ?? [];

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "Admin", href: "/listen-and-log/admin" },
          { label: "Reports" },
        ]}
      />
      <div className="p-6">
        <ReportsClient tasks={tasks} />
      </div>
    </>
  );
}
