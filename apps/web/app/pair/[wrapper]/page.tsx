import { ComingSoon } from "@/components/ComingSoon";

export default function PairPage({ params }: { params: { wrapper: string } }) {
  return <ComingSoon title={`Pair ${params.wrapper.slice(0, 10)}…`} day="Day 4 — wrap/unwrap + snippets" />;
}
