"use client";

import { LnlTable, type LnlTableColumn } from "@/components/lnl/ui/lnl-table";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { revokeInvitation, resendInvitation } from "@/app/listen-and-log/admin/users/actions";
import { useState } from "react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token?: string;
  expires_at: string;
  created_at: string;
  [key: string]: unknown;
}

const statusVariant: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
  pending: "warning",
  accepted: "success",
  expired: "error",
  revoked: "default",
};

const roleLabel: Record<string, string> = {
  lnl_admin: "Admin",
  lnl_auditor: "Auditor",
  lnl_annotator: "Annotator",
};

export function InvitationsTable({ invitations }: { invitations: Invitation[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRevoke(id: string) {
    setLoading(id);
    await revokeInvitation(id);
    setLoading(null);
  }

  async function handleResend(id: string) {
    setLoading(id);
    const result = await resendInvitation(id);
    setLoading(null);
    if (result.error) {
      toast.error(result.error);
    } else if (result.emailSent === false) {
      toast.warning(
        "Invitation updated. Email could not be sent — use Copy link to share manually."
      );
    } else {
      toast.success("Invitation resent");
    }
  }

  const columns: LnlTableColumn<Invitation>[] = [
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <LnlBadge variant="info">{roleLabel[row.role] ?? row.role}</LnlBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <LnlBadge variant={statusVariant[row.status] ?? "default"}>
          {row.status}
        </LnlBadge>
      ),
    },
    {
      key: "expires_at",
      header: "Expires",
      render: (row) => (
        <span className="text-neutral-400">
          {new Date(row.expires_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "pending" ? (
          <div className="flex flex-wrap gap-2">
            {row.token && (
              <LnlButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const link = `${window.location.origin}/listen-and-log/invite?token=${row.token}`;
                  navigator.clipboard.writeText(link);
                }}
              >
                Copy link
              </LnlButton>
            )}
            <LnlButton
              variant="ghost"
              size="sm"
              onClick={() => handleResend(row.id)}
              loading={loading === row.id}
            >
              Resend
            </LnlButton>
            <LnlButton
              variant="ghost"
              size="sm"
              onClick={() => handleRevoke(row.id)}
              loading={loading === row.id}
            >
              Revoke
            </LnlButton>
          </div>
        ) : null,
    },
  ];

  return (
    <LnlTable
      columns={columns}
      data={invitations}
      emptyMessage="No invitations yet"
    />
  );
}
