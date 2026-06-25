"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { wagmiConfig } from "@/lib/wagmi";
import { zamaConfig } from "@/lib/zama";

/**
 * App providers. Order matters: WagmiProvider → QueryClientProvider → ZamaProvider.
 * ZamaProvider wires the relayer/signer/storage for FHE shield/unshield/decrypt.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>{children}</ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
