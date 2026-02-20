import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { LnlCard } from "@/components/lnl/ui/lnl-card";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <LnlCard className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-neutral-100">Invalid Invitation</h1>
          <p className="mt-2 text-sm text-neutral-400">
            No invitation token was provided. Please check the link you received.
          </p>
        </LnlCard>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = `/listen-and-log/invite?token=${token}`;
    redirect(`/auth/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
  }

  const adminClient = getAdminClient();
  const { data: invitation } = await adminClient
    .from("lnl_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (!invitation) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <LnlCard className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-neutral-100">Invitation Not Found</h1>
          <p className="mt-2 text-sm text-neutral-400">
            This invitation link is not valid. It may have been revoked.
          </p>
        </LnlCard>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    redirect("/listen-and-log");
  }

  if (invitation.status === "revoked") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <LnlCard className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-neutral-100">Invitation Revoked</h1>
          <p className="mt-2 text-sm text-neutral-400">
            This invitation has been revoked. Please contact the administrator.
          </p>
        </LnlCard>
      </div>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <LnlCard className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-neutral-100">Invitation Expired</h1>
          <p className="mt-2 text-sm text-neutral-400">
            This invitation has expired. Please ask the administrator to resend it.
          </p>
        </LnlCard>
      </div>
    );
  }

  // Accept the invitation: create or update lnl_user_roles
  const { data: existingRole } = await adminClient
    .from("lnl_user_roles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingRole) {
    await adminClient
      .from("lnl_user_roles")
      .update({ role: invitation.role, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  } else {
    await adminClient.from("lnl_user_roles").insert({
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });
  }

  // Mark invitation as accepted
  await adminClient
    .from("lnl_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  redirect("/listen-and-log");
}
