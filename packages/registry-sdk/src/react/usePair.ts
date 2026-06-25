import { useMemo } from "react";
import type { PublicClient } from "viem";
import { useRegistryPairs } from "./useRegistryPairs.js";
import type { RegistryPair } from "../core/types.js";

export interface UsePairArgs {
  client: PublicClient | undefined;
  chainId: number;
  /** Token or wrapper address to look up (case-insensitive). */
  address: string;
}

export interface UsePairResult {
  pair: RegistryPair | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Resolve a single registry pair by token OR wrapper address. Backed by the cached
 * `useRegistryPairs` query, so opening a pair after the Explorer loaded is instant.
 */
export function usePair({ client, chainId, address }: UsePairArgs): UsePairResult {
  const { data, isLoading, isError, error } = useRegistryPairs({ client, chainId });
  const target = address.toLowerCase();
  const pair = useMemo(
    () => data?.find((p) => p.token.toLowerCase() === target || p.wrapper.toLowerCase() === target),
    [data, target],
  );
  return { pair, isLoading, isError, error: (error as Error) ?? null };
}
