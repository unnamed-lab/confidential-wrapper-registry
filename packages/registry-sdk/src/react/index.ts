/**
 * React layer for @cwr/registry-sdk.
 *
 * STATUS: scaffolding only. Hooks are implemented across the build schedule:
 *   - useRegistryPairs / usePair        -> Day 2 (TanStack Query over readAllPairs/enrichPairs)
 *   - useWrap / useUnwrap               -> Day 4 (sdk.createWrappedToken().shield/unshield)
 *   - useDecryptBalance                 -> Day 5 (EIP-712 permit + IndexedDB cache)
 *   - useBatchDecrypt                   -> Day 6 (one signature, many handles) ⭐
 *   - useFaucet                         -> Day 7
 *   - useRegistryEvents                 -> Day 9 (chunked getLogs + anomaly detection)
 *
 * Every hook returns a discriminated-union status so the UI can render precise
 * states: "idle" | "pending" | "awaiting-signature" | "confirming" | "success" | "error".
 */

export type HookStatus =
  | "idle"
  | "pending"
  | "awaiting-signature"
  | "confirming"
  | "success"
  | "error";

// Implemented hooks
export { useRegistryPairs } from "./useRegistryPairs.js";
export type { UseRegistryPairsArgs } from "./useRegistryPairs.js";
export { usePair } from "./usePair.js";
export type { UsePairArgs, UsePairResult } from "./usePair.js";

// Re-export core types so the /react entrypoint is self-contained for UI consumers.
export type { RegistryPair, PairStatus } from "../core/types.js";

// Re-export the snippet generator so UI code imports everything from one entrypoint.
export { generateSnippet } from "../snippets/index.js";
export type { SnippetFlavor, SnippetOptions } from "../snippets/index.js";
