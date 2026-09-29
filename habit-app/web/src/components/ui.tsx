import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

// 기본 버튼은 잉크(검정), 골드는 인증 버튼 등 핵심 지점에만 쓴다. 골드 위 글자는 흰색이 아니라 ink.
export function Button({ variant = "primary", block, className, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "gold" | "line" | "plain" | "danger"; block?: boolean }) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 font-bold transition-[background-color,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        block && "w-full",
        variant === "primary" && "bg-ink text-paper hover:bg-ink/90 disabled:bg-mute disabled:text-ink/50",
        variant === "gold" && "bg-gold text-ink hover:bg-[#a67a24] disabled:bg-mute disabled:text-ink/50",
        variant === "line" && "bg-gold-light/70 text-ink hover:bg-gold-light disabled:text-ink/40",
        variant === "plain" && "min-h-11 px-1 font-semibold underline underline-offset-4 disabled:text-ink/40",
        variant === "danger" && "bg-transparent text-ink ring-1 ring-ink/30 hover:bg-ink hover:text-paper disabled:opacity-40",
        className,
      )}
    />
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-3xl bg-white p-5 ring-1 ring-ink/[0.06]", className)}>
      {title && <h2 className="mb-3 text-[15px] font-bold text-ink/70">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink/80">{label}</span>
      <input {...p} className={cx("min-h-13 w-full rounded-2xl border-0 bg-white px-4 text-base ring-1 ring-ink/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ink disabled:bg-ink/5", p.className)} />
      {hint && <span className="mt-1.5 block text-sm text-ink/70">{hint}</span>}
    </label>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "error" }) {
  return (
    <div role={tone === "error" ? "alert" : undefined}
      className={cx("rounded-2xl px-4 py-3 text-sm leading-relaxed", tone === "info" && "bg-gold-light/70", tone === "warn" && "bg-gold-light ring-1 ring-gold/50", tone === "error" && "bg-white font-semibold ring-1 ring-ink")}>
      {children}
    </div>
  );
}

export const Spinner = () => <p className="py-16 text-center text-ink/70">불러오는 중…</p>;
export const Muted = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cx("text-sm text-ink/70", className)}>{children}</p>;
export const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5"><span className="shrink-0 whitespace-nowrap text-ink/70">{k}</span><span className="min-w-0 text-right font-semibold [overflow-wrap:anywhere]">{v}</span></div>
);

export async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true; } catch { return false; }
}
