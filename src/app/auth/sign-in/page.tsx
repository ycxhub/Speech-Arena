"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "password-reset") {
      toast.success("Password reset successfully. You can now sign in.");
      router.replace("/auth/sign-in");
    }
  }, [searchParams, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setLoading(true);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      const message =
        signInError.message?.toLowerCase().includes("invalid") ||
        signInError.message?.toLowerCase().includes("credentials")
          ? "Invalid credentials. Please check your email and password."
          : signInError.message ?? "Something went wrong. Please try again.";
      setError(message);
      return;
    }

    router.push("/blind-test");
  }

  async function handleGoogleSignIn() {
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

  return (
    <GlassCard className="w-full max-w-md">
        <h1 className="mb-6 text-center text-xl font-semibold text-white">
          TTS Arena
        </h1>

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
          <GlassInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="text-sm text-accent-red" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-accent-blue hover:text-accent-blue/80"
            >
              Forgot password?
            </Link>
          </div>

          <GlassButton
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Sign in
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
            onClick={handleGoogleSignIn}
            loading={googleLoading}
            disabled={googleLoading}
          >
            Sign in with Google
          </GlassButton>
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-accent-blue hover:text-accent-blue/80"
          >
            Sign up
          </Link>
        </p>
      </GlassCard>
  );
}
