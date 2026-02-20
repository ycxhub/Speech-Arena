import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { redirect } from "next/navigation";
import { getTasks } from "./tasks/actions";
import {
  getAdminDashboardStats,
  RecentActivityItem,
} from "./actions";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import Link from "next/link";

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
  return `${Math.floor(diffMs / 86400_000)}d ago`;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) redirect("/listen-and-log");

  const [{ data: tasks }, stats] = await Promise.all([
    getTasks(),
    getAdminDashboardStats(),
  ]);

  const taskList = tasks ?? [];
  const tasksByStatus = taskList.reduce(
    (acc, t) => {
      const status = (t as { status: string }).status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "Admin" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <LnlCard>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Total Tasks
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-100">
              {stats.tasksCount}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
              {Object.entries(tasksByStatus).map(([status, count]) => (
                <span key={status}>
                  {count} {status}
                </span>
              ))}
              {Object.keys(tasksByStatus).length === 0 && (
                <span>—</span>
              )}
            </div>
          </LnlCard>
          <LnlCard>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Total Users
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-100">
              {stats.usersCount}
            </p>
          </LnlCard>
          <LnlCard>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Total Annotations
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-100">
              {stats.annotationsCount}
            </p>
          </LnlCard>
          <LnlCard>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Quick Actions
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/listen-and-log/admin/tasks/new">
                <LnlButton size="sm">+ New Task</LnlButton>
              </Link>
              <Link href="/listen-and-log/admin/users">
                <LnlButton variant="secondary" size="sm">
                  Manage Users
                </LnlButton>
              </Link>
              <Link href="/listen-and-log/admin/reports">
                <LnlButton variant="secondary" size="sm">
                  View Reports
                </LnlButton>
              </Link>
            </div>
          </LnlCard>
        </div>

        <LnlCard>
          <h2 className="text-sm font-semibold text-neutral-100">
            Recent Activity
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Last 10 annotation events
          </p>
          <ul className="mt-4 space-y-2">
            {stats.recentActivity.length === 0 ? (
              <li className="py-4 text-center text-sm text-neutral-500">
                No activity yet
              </li>
            ) : (
              stats.recentActivity.map((a: RecentActivityItem) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <LnlBadge variant="default">{a.change_type}</LnlBadge>
                    <span className="truncate text-neutral-300">{a.task_name}</span>
                    <span className="shrink-0 text-neutral-500">
                      Item #{a.item_index}
                    </span>
                    {a.user_email && (
                      <span className="truncate text-neutral-500">
                        {a.user_email}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {formatRelativeTime(a.created_at)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </LnlCard>
      </div>
    </>
  );
}
