import { headers } from "next/headers";
import { NavBarWithSession } from "./nav-bar-with-session";
import { EmailVerificationBanner } from "./email-verification-banner";
import { Footer } from "./footer";

export interface AppShellProps {
  children: React.ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";

  if (pathname.startsWith("/murf-playground")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBarWithSession />
      <EmailVerificationBanner />
      <main className="flex-1 px-6 py-8 text-black">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
