import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  title: "TTS Arena",
  description: "TTS Arena - Compare TTS voices in blind tests",
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
          position="top-right"
          theme="dark"
          richColors
          duration={4000}
          closeButton
          toastOptions={{
            classNames: {
              success: "!bg-accent-green/20 !border-accent-green !text-accent-green",
              error: "!bg-accent-red/20 !border-accent-red !text-accent-red",
              warning: "!bg-accent-yellow/20 !border-accent-yellow !text-accent-yellow",
              info: "!bg-accent-blue/20 !border-accent-blue !text-accent-blue",
            },
          }}
        />
      </body>
    </html>
  );
}
