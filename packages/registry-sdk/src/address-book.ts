import type { Address } from "viem";

/**
 * Single source of truth for on-chain addresses, per chain id.
 *
 * ⚠️ VERIFICATION STATUS (see .ai/VERIFIED-FACTS.md):
 *   - Mainnet registry below is a CANDIDATE from web search — NOT yet confirmed on-chain.
 *   - Sepolia registry + cTokenMock list are PLACEHOLDERS (zero address) pending Day-2
 *     verification from docs.zama.org → Protocol Apps → Registry / addresses page.
 *
 * Never trust an address here until its `verified` flag is true. The `scripts/verify-addresses`
 * task (Day 2) reads each registry on-chain and flips these flags.
 */

export const SEPOLIA = 11155111 as const;
export const MAINNET = 1 as const;
export type SupportedChainId = typeof SEPOLIA | typeof MAINNET;

export interface ChainAddresses {
  /** ConfidentialTokenWrappersRegistry */
  registry: Address;
  /** Optional faucet helper (Sepolia only) — set after deploy, else undefined */
  faucetDistributor?: Address;
  /** Official cTokenMock ERC-20s usable on testnet */
  cTokenMocks: Address[];
  /** First block to scan for registry events (event indexing) */
  registryDeployBlock?: bigint;
  /** Whether every address in this entry has been confirmed on-chain */
  verified: boolean;
}

export const ADDRESS_BOOK: Record<SupportedChainId, ChainAddresses> = {
  [SEPOLIA]: {
    registry: "0x0000000000000000000000000000000000000000",
    cTokenMocks: [],
    verified: false,
  },
  [MAINNET]: {
    // CANDIDATE — confirm on-chain before shipping.
    registry: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
    cTokenMocks: [],
    verified: false,
  },
};

export const ZAMA_RELAYER_URL: Partial<Record<SupportedChainId, string>> = {
  [SEPOLIA]: "https://relayer.testnet.zama.org",
};

export function getChainAddresses(chainId: number): ChainAddresses {
  const entry = ADDRESS_BOOK[chainId as SupportedChainId];
  if (!entry) throw new Error(`Unsupported chainId: ${chainId}`);
  return entry;
}
