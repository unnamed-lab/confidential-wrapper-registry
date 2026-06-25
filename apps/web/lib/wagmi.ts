import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { env } from "./env";

/**
 * wagmi v3 config. We rely on EIP-6963 multi-injected-provider discovery (enabled by
 * default) for wallet connectors, which avoids importing the heavy `wagmi/connectors`
 * barrel (it statically references optional connectors — porto/safe/tempo — with peer
 * deps we don't ship). Both chains are configured so the Explorer can read either
 * network via `usePublicClient({ chainId })` regardless of the wallet's chain.
 */
export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [mainnet.id]: http(env.NEXT_PUBLIC_MAINNET_RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
