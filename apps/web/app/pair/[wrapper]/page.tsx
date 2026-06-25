import { PairDetail } from "@/components/PairDetail";

export default function PairPage({ params }: { params: { wrapper: string } }) {
  return <PairDetail wrapper={params.wrapper} />;
}
