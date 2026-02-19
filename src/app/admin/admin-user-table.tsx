"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { UserRoleSelect } from "./user-role-select";
import { updateUserRole } from "./actions";

export type ProfileRow = {
  id: string;
  email: string;
  role: string;
  blind_count: number;
  custom_count: number;
  created_at: string;
};

function MakeAdminButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const { error } = await updateUserRole(userId, "admin");
    setLoading(false);
    if (!error) router.refresh();
  }

  return (
    <GlassButton
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleClick}
      loading={loading}
      disabled={loading}
    >
      Make admin
    </GlassButton>
  );
}

/**
 * Client component for the admin user management table.
 * Must be a client component because the role column uses UserRoleSelect
 * (which needs interactivity) and GlassTable's render prop cannot be
 * passed from Server Components (functions are not serializable in RSC).
 */
export function AdminUserTable({ data }: { data: ProfileRow[] }) {
  const columns = [
    { key: "email" as const, header: "Email" },
    { key: "blind_count" as const, header: "No. of Blind tests" },
    { key: "custom_count" as const, header: "Custom tests" },
    {
      key: "role" as const,
      header: "Role",
      render: (row: ProfileRow) =>
        row.role === "admin" ? (
          <UserRoleSelect userId={row.id} currentRole={row.role} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-white/80">User</span>
            <MakeAdminButton userId={row.id} />
          </div>
        ),
    },
    { key: "created_at" as const, header: "Joined" },
  ];

  return <GlassTable<ProfileRow> columns={columns} data={data} />;
}
