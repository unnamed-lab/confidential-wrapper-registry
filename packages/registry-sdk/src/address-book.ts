import type { Address } from "viem";

/**
 * Single source of truth for on-chain addresses, per chain id.
 *
 * ✅ VERIFIED ON-CHAIN 2026-06-25 (packages/cli/scripts/verify-addresses.ts):
 *   - Both registries respond to our ABI: Sepolia reports 8 pairs, mainnet 9.
 *   - Every wrapper returns true for supportsInterface(0x4958f2a4).
 * Source of addresses: docs.zama.org → Protocol Apps → Addresses (testnet/sepolia, mainnet/ethereum).
 *
 * Note: the pair list itself is read DYNAMICALLY from the registry at runtime (that's the
 * coverage requirement) — we only pin the registry address, the Sepolia faucet token mocks,
 * and (after deploy) the FaucetDistributor here.
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
    registry: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
    // Underlying mock ERC-20s the faucet should dispense (so users can wrap them).
    // Mint policy / decimals to confirm on Day 7 before choosing the faucet approach.
    cTokenMocks: [
      "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF", // USDCMock
      "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0", // USDTMock
      "0xff54739b16576FA5402F211D0b938469Ab9A5f3F", // WETHMock
      "0xFf021fB13cA64e5354c62c954b949a88cfDEb25E", // BRONMock
      "0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57", // ZAMAMock
      "0x93c931278A2aad1916783F952f94276eA5111442", // tGBPMock
      "0x24377AE4AA0C45ecEe71225007f17c5D423dd940", // XAUtMock
    ],
    verified: true,
  },
  [MAINNET]: {
    registry: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
    cTokenMocks: [], // no faucet on mainnet
    verified: true,
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
