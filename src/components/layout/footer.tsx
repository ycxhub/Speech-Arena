import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative flex w-full items-center justify-center overflow-hidden border-t border-white/10 py-8 min-h-[6rem]">
      <Image
        src="/speecharenaorg.png"
        alt="speecharena.org"
        width={180}
        height={48}
        className="object-contain opacity-90"
        sizes="(max-width: 768px) 120px, 180px"
      />
    </footer>
  );
}
