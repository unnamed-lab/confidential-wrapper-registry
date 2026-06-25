import { createConfig as createZamaConfig } from "@zama-fhe/react-sdk/wagmi";
import { web } from "@zama-fhe/sdk/web";
import { sepolia, mainnet } from "@zama-fhe/sdk/chains";
import { wagmiConfig } from "./wagmi";

/**
 * Zama FHE config, layered on top of the wagmi config. The chain presets already
 * carry their relayer URLs (relayer.testnet/mainnet.zama.org), so we just map a
 * web() relayer per chain. Used by <ZamaProvider> in providers.tsx.
 */
export const zamaConfig = createZamaConfig({
  chains: [sepolia, mainnet],
  wagmiConfig,
  relayers: {
    [sepolia.id]: web(),
    [mainnet.id]: web(),
  },
});
