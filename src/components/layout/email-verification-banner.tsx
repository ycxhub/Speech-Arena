import { createClient } from "@/lib/supabase/server";

/**
 * Shows a banner prompting unverified users to confirm their email.
 * Only visible to signed-in users whose email_confirmed_at is null.
 */
export async function EmailVerificationBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email_confirmed_at) {
    return null;
  }

  return (
    <div
      className="border-b border-accent-yellow/30 bg-accent-yellow/10 px-6 py-3 text-center text-sm text-accent-yellow"
      role="alert"
    >
      Please verify your email. Check your inbox for the confirmation link.
    </div>
  );
}
