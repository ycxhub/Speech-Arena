import type { Metadata } from "next";
import { getActivePlaygroundPages } from "./[slug]/actions";
import { PlaygroundNavbar } from "@/components/murf-playground/playground-navbar";
import "./murf-playground.css";

export const metadata: Metadata = {
  title: "Murf Playground | Speech Arena",
  robots: { index: false, follow: false },
};

export default async function MurfPlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pages = await getActivePlaygroundPages();

  return (
    <div className="murf-playground fixed inset-0 z-50 flex flex-col">
      <PlaygroundNavbar pages={pages} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
