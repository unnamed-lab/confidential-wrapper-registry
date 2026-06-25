import type { Address } from "viem";

export type PairStatus = "active" | "revoked" | "interface-mismatch";

export interface RegistryPair {
  /** Public ERC-20 */
  token: Address;
  /** Confidential ERC-7984 wrapper */
  wrapper: Address;
  /** Registry validity flag (false = revoked but still present) */
  isValid: boolean;

  // --- Enriched client-side (optional until enrichPair runs) ---
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimals?: number;
  wrapperSymbol?: string;
  /** Result of supportsInterface(ERC7984_INTERFACE_ID) on the wrapper */
  supportsERC7984?: boolean;

  /** Derived display status (see deriveStatus) */
  status: PairStatus;
}

export interface ReadPairsOptions {
  /** Page size for getTokenConfidentialTokenPairsSlice. Default 50. */
  pageSize?: number;
}
