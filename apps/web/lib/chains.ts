import { mainnet, sepolia } from "wagmi/chains";

/** Chain ids supported by the wagmi config (keep in sync with lib/wagmi.ts). */
export type AppChainId = typeof sepolia.id | typeof mainnet.id;

export const APP_CHAINS: { id: AppChainId; label: string }[] = [
  { id: sepolia.id, label: "Sepolia" },
  { id: mainnet.id, label: "Mainnet" },
];

export function explorerBase(chainId: number): string {
  return chainId === mainnet.id ? "https://etherscan.io" : "https://sepolia.etherscan.io";
}
