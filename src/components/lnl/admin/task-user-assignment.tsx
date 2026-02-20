"use client";

import { useState } from "react";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import { LnlSelect } from "@/components/lnl/ui/lnl-select";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";

export interface TaskAssignment {
  userId: string;
  email: string;
  role: string;
}

interface Props {
  availableUsers: Array<{ user_id: string; email: string; role: string }>;
  value: TaskAssignment[];
  onChange: (assignments: TaskAssignment[]) => void;
}

export function TaskUserAssignment({ availableUsers, value, onChange }: Props) {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("annotator");

  const assignedIds = new Set(value.map((a) => a.userId));
  const filtered = availableUsers.filter(
    (u) =>
      !assignedIds.has(u.user_id) &&
      u.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  function addUser(userId: string, email: string) {
    onChange([...value, { userId, email, role: selectedRole }]);
    setSearchEmail("");
  }

  function removeUser(userId: string) {
    onChange(value.filter((a) => a.userId !== userId));
  }

  function updateRole(userId: string, role: string) {
    onChange(
      value.map((a) => (a.userId === userId ? { ...a, role } : a))
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <LnlInput
            label="Search users by email"
            placeholder="Type to search..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
        </div>
        <div className="w-36">
          <LnlSelect
            label="Role"
            options={[
              { value: "annotator", label: "Annotator" },
              { value: "auditor", label: "Auditor" },
            ]}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          />
        </div>
      </div>

      {searchEmail && filtered.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900">
          {filtered.slice(0, 10).map((u) => (
            <button
              key={u.user_id}
              type="button"
              onClick={() => addUser(u.user_id, u.email)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              <span>{u.email}</span>
              <span className="text-xs text-blue-400">+ Add</span>
            </button>
          ))}
        </div>
      )}

      {searchEmail && filtered.length === 0 && (
        <p className="text-sm text-neutral-500">
          No matching users found. You can invite new users from the Users & Invitations page.
        </p>
      )}

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Assigned Users ({value.length})
          </h4>
          {value.map((a) => (
            <div
              key={a.userId}
              className="flex items-center justify-between rounded-lg border border-neutral-800 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-200">{a.email}</span>
                <LnlBadge variant={a.role === "auditor" ? "warning" : "info"}>
                  {a.role}
                </LnlBadge>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={a.role}
                  onChange={(e) => updateRole(a.userId, e.target.value)}
                  className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300"
                >
                  <option value="annotator">Annotator</option>
                  <option value="auditor">Auditor</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeUser(a.userId)}
                  className="text-xs text-neutral-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
