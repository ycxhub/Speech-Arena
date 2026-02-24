import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "Speech Arena",
  description:
    "Speech Arena - Rank speech models through crowd-sourced blind tests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <AppShell>{children}</AppShell>
        <Toaster
          position="top-center"
          theme="dark"
          richColors={false}
          duration={4000}
          closeButton
          offset={{ top: "5rem" }}
          toastOptions={{
            classNames: {
              success: "!bg-[#0a0a0a] !border !border-accent-green !text-accent-green",
              error: "!bg-[#0a0a0a] !border !border-accent-red !text-accent-red",
              warning: "!bg-[#0a0a0a] !border !border-accent-yellow !text-accent-yellow",
              info: "!bg-[#0a0a0a] !border !border-accent-blue !text-accent-blue",
            },
          }}
        />
        {process.env.NODE_ENV === "production" &&
          process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
            <GoogleAnalytics
              gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}
            />
          )}
        <Analytics />
      </body>
    </html>
  );
}
