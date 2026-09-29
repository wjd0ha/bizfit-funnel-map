import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

// 골드 버튼 위 글자는 흰색이 아니라 ink (대비 확보)
export function Button({ variant = "primary", block, className, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "line" | "plain" | "danger"; block?: boolean }) {
  return (
    <button
      {...p}
      className={cx(
        "min-h-11 px-4 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed",
        block && "w-full",
        variant === "primary" && "bg-gold text-ink hover:bg-[#a67a24] disabled:bg-mute disabled:text-ink/70",
        variant === "line" && "border border-ink/25 text-ink bg-transparent hover:bg-gold-light disabled:text-ink/40",
        variant === "plain" && "text-ink underline underline-offset-2 disabled:text-ink/40",
        variant === "danger" && "border border-ink text-ink hover:bg-ink hover:text-paper disabled:opacity-40",
        className,
      )}
    />
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-xl border border-ink/10 bg-white p-4", className)}>
      {title && <h2 className="mb-2 text-base font-bold">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input {...p} className={cx("min-h-11 w-full rounded-lg border border-ink/25 bg-white px-3 text-base", p.className)} />
      {hint && <span className="mt-1 block text-sm text-ink/70">{hint}</span>}
    </label>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "error" }) {
  return (
    <div role={tone === "error" ? "alert" : undefined}
      className={cx("rounded-lg px-3 py-2 text-sm", tone === "info" && "bg-gold-light", tone === "warn" && "border border-gold bg-gold-light", tone === "error" && "border border-ink bg-white font-semibold")}>
      {children}
    </div>
  );
}

export const Spinner = () => <p className="py-10 text-center text-ink/70">불러오는 중…</p>;
export const Muted = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cx("text-sm text-ink/70", className)}>{children}</p>;
export const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-1"><span className="text-ink/70">{k}</span><span className="text-right font-semibold">{v}</span></div>
);

export async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true; } catch { return false; }
}
