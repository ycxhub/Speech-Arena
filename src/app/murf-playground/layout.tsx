import type { Metadata } from "next";
import "./murf-playground.css";

export const metadata: Metadata = {
  title: "Murf Playground | Speech Arena",
  robots: { index: false, follow: false },
};

export default function MurfPlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="murf-playground fixed inset-0 z-50 overflow-auto">
      {children}
    </div>
  );
}
