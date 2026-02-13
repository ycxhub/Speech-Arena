import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";

export default function AuthPage() {
  return (
    <GlassCard className="w-full max-w-md space-y-4">
      <div className="flex justify-center">
        <Image
          src="/speech-arena-logo.png"
          alt="Speech Arena"
          width={120}
          height={42}
          className="h-10 w-auto object-contain"
        />
      </div>
      <p className="text-center text-sm text-white/60">
        Sign in to continue or create an account.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/auth/sign-in" className="block">
          <GlassButton className="w-full" type="button">
            Sign in
          </GlassButton>
        </Link>
        <Link href="/auth/sign-up" className="block">
          <GlassButton className="w-full" variant="secondary" type="button">
            Sign up
          </GlassButton>
        </Link>
      </div>
    </GlassCard>
  );
}
