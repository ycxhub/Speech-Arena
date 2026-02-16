import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Admin Dashboard</h1>

      <GlassCard>
        <p className="text-white/80">
          Use the sidebar to manage users, languages, sentences, providers, and
          view test logs, analytics, and audit logs.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/admin/user-management"
            className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
          >
            User Management
          </Link>
          <Link
            href="/admin/languages"
            className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
          >
            Languages
          </Link>
          <Link
            href="/admin/providers"
            className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
          >
            Providers
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
