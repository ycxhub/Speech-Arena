"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "./actions";
import { GlassSelect } from "@/components/ui/glass-select";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

interface UserRoleSelectProps {
  userId: string;
  currentRole: string;
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as "user" | "admin";
    if (newRole !== "user" && newRole !== "admin") return;
    if (newRole === role) return;

    const prevRole = role;
    setRole(newRole);
    setLoading(true);
    const { error } = await updateUserRole(userId, newRole);
    setLoading(false);

    if (error) {
      setRole(prevRole);
      return;
    }

    router.refresh();
  }

  return (
    <GlassSelect
      options={ROLE_OPTIONS}
      value={role}
      onChange={handleChange}
      disabled={loading}
      className="min-w-[8rem]"
    />
  );
}
