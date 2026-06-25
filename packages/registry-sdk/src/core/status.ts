import type { PairStatus, RegistryPair } from "./types.js";

/**
 * Derive the display status of a pair from its registry validity and the
 * on-chain ERC-7984 interface check.
 *
 * Precedence:
 *   1. `isValid === false`  -> "revoked"   (revocation is the dominant signal)
 *   2. interface check ran and failed -> "interface-mismatch"
 *   3. otherwise -> "active"
 *
 * Note: when `supportsERC7984` is undefined the wrapper hasn't been enriched yet;
 * we optimistically treat a valid pair as "active" rather than flagging a mismatch
 * we haven't actually observed.
 */
export function deriveStatus(pair: Pick<RegistryPair, "isValid" | "supportsERC7984">): PairStatus {
  if (!pair.isValid) return "revoked";
  if (pair.supportsERC7984 === false) return "interface-mismatch";
  return "active";
}
