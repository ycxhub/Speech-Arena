import Image from "next/image";

export function Footer() {
  return (
    <footer className="flex w-full items-center justify-center border-t border-white/10 py-8">
      <Image
        src="/speech-arena-footer-logo.png"
        alt="speecharena.org"
        width={200}
        height={48}
        className="h-10 w-auto object-contain opacity-100"
      />
    </footer>
  );
}
