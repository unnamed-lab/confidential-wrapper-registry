import type { PairStatus } from "@cwr/registry-sdk";

const MAP: Record<PairStatus, { label: string; cls: string; title: string }> = {
  active: {
    label: "Verified ERC-7984",
    cls: "bg-active-soft text-active ring-active/30",
    title: "Valid pair; wrapper supports the ERC-7984 interface (0x4958f2a4)",
  },
  revoked: {
    label: "Revoked",
    cls: "bg-revoked-soft text-revoked ring-revoked/30",
    title: "Registry marked this pair invalid. Still shown for coverage — do not use.",
  },
  "interface-mismatch": {
    label: "Interface mismatch",
    cls: "bg-mismatch-soft text-mismatch ring-mismatch/30",
    title: "Wrapper does not report the ERC-7984 interface via supportsInterface",
  },
};

export function StatusBadge({ status }: { status: PairStatus }) {
  const s = MAP[status];
  return (
    <span
      title={s.title}
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
