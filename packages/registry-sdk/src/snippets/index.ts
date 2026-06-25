import type { RegistryPair } from "../core/types.js";

export type SnippetFlavor = "wagmi" | "viem" | "ethers";

export interface SnippetOptions {
  chainId: number;
  /** Example amount used in the generated call, in human units. Default "1.0". */
  amount?: string;
}

/**
 * Emit ready-to-paste integration code for a registry pair, in three flavors.
 * This is the "templates and resources" deliverable made literal: each snippet
 * imports the Zama v3 SDK, constructs the wrapped token from the pair's real
 * wrapper address, and shields an amount — pre-filled with chain-correct values.
 */
export function generateSnippet(pair: RegistryPair, flavor: SnippetFlavor, opts: SnippetOptions): string {
  const amount = opts.amount ?? "1.0";
  const decimals = pair.tokenDecimals ?? 18;
  const sym = pair.tokenSymbol ?? "TOKEN";
  switch (flavor) {
    case "wagmi":
      return wagmiSnippet(pair, opts.chainId, amount, decimals, sym);
    case "viem":
      return viemSnippet(pair, opts.chainId, amount, decimals, sym);
    case "ethers":
      return ethersSnippet(pair, opts.chainId, amount, decimals, sym);
  }
}

function header(pair: RegistryPair, chainId: number, sym: string): string {
  return `// Wrap ${sym} (${pair.token})
//   -> confidential ${pair.wrapperSymbol ?? "c" + sym} (${pair.wrapper})
// chainId: ${chainId}`;
}

function wagmiSnippet(pair: RegistryPair, chainId: number, amount: string, decimals: number, sym: string): string {
  return `${header(pair, chainId, sym)}
import { parseUnits } from "viem";
import { useZamaSdk } from "@zama-fhe/react-sdk";

export function useWrap${sym}() {
  const sdk = useZamaSdk();
  return async function wrap() {
    const wt = sdk.createWrappedToken("${pair.wrapper}");
    // shield() handles ERC-20 approve + deposit, then encrypts the balance on-chain
    return wt.shield(parseUnits("${amount}", ${decimals}));
  };
}`;
}

function viemSnippet(pair: RegistryPair, chainId: number, amount: string, decimals: number, sym: string): string {
  return `${header(pair, chainId, sym)}
import { parseUnits } from "viem";
import { createZamaSdk } from "@zama-fhe/sdk";

const sdk = await createZamaSdk({ chainId: ${chainId} /* + walletClient */ });
const wt = sdk.createWrappedToken("${pair.wrapper}");
await wt.shield(parseUnits("${amount}", ${decimals})); // wrap ${amount} ${sym}
// To read your confidential balance (EIP-712 user-decryption):
const balance = await wt.balanceOf(/* yourAddress */);`;
}

function ethersSnippet(pair: RegistryPair, chainId: number, amount: string, decimals: number, sym: string): string {
  return `${header(pair, chainId, sym)}
import { parseUnits } from "ethers";
import { createZamaSdk } from "@zama-fhe/sdk";

const sdk = await createZamaSdk({ chainId: ${chainId} /* + ethers signer */ });
const wt = sdk.createWrappedToken("${pair.wrapper}");
await wt.shield(parseUnits("${amount}", ${decimals})); // wrap ${amount} ${sym}
// Unwrap back to public:
await wt.unshield(parseUnits("${amount}", ${decimals}));`;
}
