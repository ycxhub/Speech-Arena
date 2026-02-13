import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass flex flex-col items-center gap-4 px-8 py-6">
        <Image
          src="/speech-arena-logo.png"
          alt="Speech Arena"
          width={200}
          height={70}
          className="h-14 w-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
