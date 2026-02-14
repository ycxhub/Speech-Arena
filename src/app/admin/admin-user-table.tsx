"use client";

import { GlassTable } from "@/components/ui/glass-table";
import { UserRoleSelect } from "./user-role-select";

export type ProfileRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

/**
 * Client component for the admin user management table.
 * Must be a client component because the role column uses UserRoleSelect
 * (which needs interactivity) and GlassTable's render prop cannot be
 * passed from Server Components (functions are not serializable in RSC).
 */
export function AdminUserTable({ data }: { data: ProfileRow[] }) {
  const columns = [
    { key: "email" as const, header: "Email" },
    {
      key: "role" as const,
      header: "Role",
      render: (row: ProfileRow) => (
        <UserRoleSelect userId={row.id} currentRole={row.role} />
      ),
    },
    { key: "created_at" as const, header: "Joined" },
  ];

  return <GlassTable<ProfileRow> columns={columns} data={data} />;
}
