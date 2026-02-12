"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message ?? "Failed to update password. The link may have expired.");
      return;
    }

    router.push("/auth/sign-in?message=password-reset");
  }

  return (
    <GlassCard className="w-full max-w-md">
        <h1 className="mb-2 text-center text-xl font-semibold text-white">
          TTS Arena
        </h1>
        <p className="mb-6 text-center text-sm text-white/60">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            helperText="At least 8 characters"
            error={
              error && error.includes("8 characters") ? error : undefined
            }
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <GlassInput
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            error={error?.includes("match") ? error : undefined}
            autoComplete="new-password"
            required
          />

          {error && !error.includes("8") && !error.includes("match") && (
            <p className="text-sm text-accent-red" role="alert">
              {error}
            </p>
          )}

          <GlassButton
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Update password
          </GlassButton>
        </form>
      </GlassCard>
  );
}
