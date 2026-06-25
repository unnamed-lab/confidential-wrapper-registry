import type { PairStatus } from "@cwr/registry-sdk";

const MAP: Record<PairStatus, { label: string; cls: string; dotCls: string; title: string }> = {
  active: {
    label: "Verified ERC-7984",
    cls: "bg-active/5 text-active border border-active/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]",
    dotCls: "bg-active animate-blink-green",
    title: "Valid pair; wrapper supports the ERC-7984 interface (0x4958f2a4)",
  },
  revoked: {
    label: "Revoked",
    cls: "bg-revoked/5 text-revoked border border-revoked/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]",
    dotCls: "bg-revoked animate-breathe-red",
    title: "Registry marked this pair invalid. Still shown for coverage — do not use.",
  },
  "interface-mismatch": {
    label: "Interface mismatch",
    cls: "bg-mismatch/5 text-mismatch border border-mismatch/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]",
    dotCls: "bg-mismatch",
    title: "Wrapper does not report the ERC-7984 interface via supportsInterface",
  },
};

export function StatusBadge({ status }: { status: PairStatus }) {
  const s = MAP[status];
  return (
    <span
      title={s.title}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-space tracking-wide uppercase ${s.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dotCls}`} />
      <span>{s.label}</span>
    </span>
  );
}
