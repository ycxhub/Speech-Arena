import { NavBarWithSession } from "./nav-bar-with-session";
import { EmailVerificationBanner } from "./email-verification-banner";
import { Footer } from "./footer";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
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
