"use client";

import { LnlTable, type LnlTableColumn } from "@/components/lnl/ui/lnl-table";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";

interface LnlUser {
  user_id: string;
  role: string;
  email: string;
  display_name: string | null;
  created_at: string;
  [key: string]: unknown;
}

const roleLabel: Record<string, string> = {
  lnl_admin: "Admin",
  lnl_auditor: "Auditor",
  lnl_annotator: "Annotator",
};

const columns: LnlTableColumn<LnlUser>[] = [
  { key: "email", header: "Email" },
  {
    key: "display_name",
    header: "Name",
    render: (row) => (
      <span className="text-neutral-400">{row.display_name ?? "—"}</span>
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (row) => (
      <LnlBadge variant="info">{roleLabel[row.role] ?? row.role}</LnlBadge>
    ),
  },
  {
    key: "created_at",
    header: "Joined",
    render: (row) => (
      <span className="text-neutral-400">
        {new Date(row.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export function UsersTable({ users }: { users: LnlUser[] }) {
  return (
    <LnlTable columns={columns} data={users} emptyMessage="No users yet" />
  );
}
