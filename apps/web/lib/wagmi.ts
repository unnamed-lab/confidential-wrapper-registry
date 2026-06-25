import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { env } from "./env";

/**
 * wagmi + RainbowKit config. Both chains are configured so the Explorer can read
 * either network via `usePublicClient({ chainId })` regardless of the wallet's chain.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Confidential Wrapper Registry",
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_ID,
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [mainnet.id]: http(env.NEXT_PUBLIC_MAINNET_RPC_URL),
  },
  ssr: true,
});
