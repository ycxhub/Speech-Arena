/**
 * Sends an L&L invitation email via Resend.
 * Requires RESEND_API_KEY and NEXT_PUBLIC_APP_URL (or VERCEL_URL) in env.
 * If Resend is not configured, returns false (invitation is still created in DB).
 */
export async function sendInviteEmail(
  email: string,
  role: string,
  token: string
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!apiKey || !baseUrl) {
    return { sent: false };
  }

  const inviteUrl = `${baseUrl}/listen-and-log/invite?token=${token}`;
  const roleLabel =
    role === "lnl_admin"
      ? "Admin"
      : role === "lnl_auditor"
        ? "Auditor"
        : "Annotator";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ?? "Listen & Log <onboarding@resend.dev>",
      to: email,
      subject: "You're invited to Listen & Log",
      html: `
        <h2>You've been invited to Listen & Log</h2>
        <p>You've been invited to join Listen & Log on Speech Arena with the role of <strong>${roleLabel}</strong>.</p>
        <p>Click the link below to accept your invitation (expires in 7 days):</p>
        <p><a href="${inviteUrl}" style="color: #3b82f6;">Accept invitation</a></p>
        <p>Or copy this URL: ${inviteUrl}</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { sent: false, error: message };
  }
}
