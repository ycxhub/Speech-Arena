"use client";

import { useState } from "react";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import { LnlSelect } from "@/components/lnl/ui/lnl-select";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { inviteUser } from "@/app/listen-and-log/admin/users/actions";

const roleOptions = [
  { value: "lnl_annotator", label: "Annotator" },
  { value: "lnl_auditor", label: "Auditor" },
  { value: "lnl_admin", label: "Admin" },
];

export function InviteUserForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setInviteLink(null);

    const formData = new FormData(e.currentTarget);
    const result = await inviteUser(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      const link = `${window.location.origin}/listen-and-log/invite?token=${result.token}`;
      setInviteLink(link);
      const emailNote =
        result.emailSent === false
          ? " Email could not be sent — share the link below manually."
          : "";
      setMessage({
        type: "success",
        text: `Invitation created for ${formData.get("email")}.${emailNote}`,
      });
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  return (
    <LnlCard>
      <h2 className="mb-4 text-sm font-semibold text-neutral-100">Invite User</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <LnlInput
              name="email"
              type="email"
              placeholder="user@example.com"
              label="Email"
              required
            />
          </div>
          <div className="w-40">
            <LnlSelect
              name="role"
              label="Role"
              options={roleOptions}
              defaultValue="lnl_annotator"
            />
          </div>
          <div className="flex items-end">
            <LnlButton type="submit" loading={loading}>
              Send Invite
            </LnlButton>
          </div>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        {inviteLink && (
          <div className="rounded-md border border-neutral-700 bg-neutral-800 p-3">
            <p className="mb-1 text-xs text-neutral-400">Share this invite link:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-xs text-neutral-300">
                {inviteLink}
              </code>
              <LnlButton
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
              >
                Copy
              </LnlButton>
            </div>
          </div>
        )}
      </form>
    </LnlCard>
  );
}
