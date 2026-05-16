import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg p-6">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-0 -right-20 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[120px]" />

      <main className="relative z-10 w-full max-w-md space-y-10 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-secondary text-4xl font-black text-white shadow-2xl shadow-primary/40">
            ✓
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white">TASK.IO</h1>
          <p className="mx-auto max-w-[280px] text-zinc-400">
            Experience the next generation of task management. Built with speed and precision.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/login"
            className="flex w-full items-center justify-center rounded-2xl bg-white px-8 py-4 text-lg font-black text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
          <div className="flex gap-4">
            <Link 
              href="/login"
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition-colors hover:bg-white/10 text-center"
            >
              Register
            </Link>
            <Link 
              href="/login"
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition-colors hover:bg-white/10 text-center"
            >
              Sign In
            </Link>
          </div>
        </div>

        <footer className="pt-10 text-xs font-bold uppercase tracking-widest text-zinc-600">
          V2.0 • Premium Edition
        </footer>
      </main>
    </div>
  );
}
