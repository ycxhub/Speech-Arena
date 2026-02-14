"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
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

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      const message =
        signUpError.message?.toLowerCase().includes("already registered") ||
        signUpError.message?.toLowerCase().includes("already exists")
          ? "Email already registered."
          : signUpError.message ?? "Something went wrong. Please try again.";
      setError(message);
      return;
    }

    // Check if Supabase created an immediately-usable session
    // (e.g. email confirmation is disabled). If so, go straight to the app.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      window.location.href = "/blind-test";
      return;
    }

    setSuccess(true);
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/blind-test`,
      },
    });

    if (oauthError) {
      setError(oauthError.message ?? "Failed to sign in with Google.");
      setGoogleLoading(false);
      return;
    }

    // OAuth redirects; loading state will persist until redirect
  }

  if (success) {
    return (
      <GlassCard className="w-full max-w-md">
          <h1 className="mb-2 text-center text-xl font-semibold text-white">
            Check your email
          </h1>
          <p className="text-center text-white/80">
            We sent a confirmation link to your email. Click it to verify
            your account &mdash; you&apos;ll be signed in automatically.
          </p>
        </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md">
        <h1 className="mb-6 text-center text-xl font-semibold text-white">
          Speech Arena
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={
              error && (error.includes("email") || error.includes("registered"))
                ? error
                : undefined
            }
            autoComplete="email"
            required
          />
          <GlassInput
            label="Password"
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

          {error && !error.includes("email") && !error.includes("8") && !error.includes("match") && !error.includes("registered") && (
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
            Sign up
          </GlassButton>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-transparent px-2 text-white/60">
                or continue with
              </span>
            </div>
          </div>

          <GlassButton
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            onClick={handleGoogleSignUp}
            loading={googleLoading}
            disabled={googleLoading}
          >
            Sign up with Google
          </GlassButton>
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?{" "}
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
