"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <GlassCard className="w-full max-w-md">
          <h1 className="mb-2 text-center text-xl font-semibold text-white">
            TTS Arena
          </h1>
          <p className="text-center text-white/80">
            If an account exists with that email, we&apos;ve sent you a
            password reset link. Please check your inbox and spam folder.
          </p>
          <Link
            href="/auth/sign-in"
            className="mt-6 block text-center text-sm text-accent-blue hover:text-accent-blue/80"
          >
            Back to sign in
          </Link>
        </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md">
        <h1 className="mb-2 text-center text-xl font-semibold text-white">
          TTS Arena
        </h1>
        <p className="mb-6 text-center text-sm text-white/60">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <GlassButton
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Send reset link
          </GlassButton>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Remember your password?{" "}
          <Link
            href="/auth/sign-in"
            className="font-medium text-accent-blue hover:text-accent-blue/80"
          >
            Sign in
          </Link>
        </p>
      </GlassCard>
  );
}
