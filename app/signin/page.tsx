import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = { title: "Sign in — Working Sheet" };

export default function SignIn() {
  return (
    <main className="grid min-h-screen place-items-center p-3 sm:p-6">
      <div className="grid w-full max-w-[1180px] overflow-hidden rounded-[36px] border border-line bg-surface shadow-card lg:grid-cols-2">
        {/* brand side: always black */}
        <section className="relative hidden min-h-[640px] overflow-hidden bg-[#0b0b0a] p-10 text-[#f3f3ea] lg:block">
          <p className="max-w-xs text-sm opacity-70">
            Plan the look. Price the tools. Publish the work.
          </p>
          <h1 className="mt-16 font-display text-7xl font-extrabold leading-[0.92] tracking-tighter">
            Plan it
            <br />
            <span className="text-[#e4ff4a]">before</span>
            <br />
            you shoot it.
          </h1>

          {/* floating board collage */}
          <div className="absolute -bottom-10 right-8 w-[300px] rotate-[6deg] rounded-[32px] border border-white/10 bg-[#161614] p-4 shadow-2xl">
            <div className="grid h-48 grid-cols-3 grid-rows-3 gap-2">
              <div className="col-span-2 row-span-2 rounded-2xl bg-[linear-gradient(135deg,#e4ff4a,#8aa600)]" />
              <div className="rounded-2xl bg-[#f3f3ea]" />
              <div className="rounded-2xl bg-[repeating-linear-gradient(45deg,#e4ff4a_0_6px,#0b0b0a_6px_12px)]" />
              <div className="col-span-2 rounded-2xl border border-white/15 p-2 text-[10px] opacity-70">
                Shot 04 · low handheld
              </div>
              <div className="rounded-2xl bg-[#2c2c28]" />
            </div>
            <div className="mt-3 flex items-end gap-1.5">
              {[40, 64, 30, 78, 52, 90].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-md bg-[#e4ff4a]"
                  style={{ height: h * 0.5, opacity: 0.35 + i * 0.12 }}
                />
              ))}
            </div>
          </div>
          <div className="absolute right-10 top-10 size-20 rounded-full border-2 border-[#e4ff4a]" />
        </section>

        {/* form side */}
        <section className="flex flex-col justify-between p-7 sm:p-12">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-lemon font-display font-extrabold text-on-lemon">
                W
              </span>
              <span className="font-display text-xl font-bold">Working Sheet</span>
            </Link>
            <ThemeToggle />
          </div>

          <div className="my-10">
            <SignInForm />
          </div>

          <p className="text-xs text-muted">
            Your pages are saved to your account and sync across devices.
          </p>
        </section>
      </div>
    </main>
  );
}
