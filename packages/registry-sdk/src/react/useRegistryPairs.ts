import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PublicClient } from "viem";
import { readAllPairs, enrichPairs } from "../core/readRegistry.js";
import type { RegistryPair, ReadPairsOptions } from "../core/types.js";
import { getChainAddresses } from "../address-book.js";

export interface UseRegistryPairsArgs extends ReadPairsOptions {
  /** A viem PublicClient for the target chain (e.g. wagmi's usePublicClient). */
  client: PublicClient | undefined;
  /** Chain id; resolves the registry address from the address book. */
  chainId: number;
  /** Enrich pairs with symbols/decimals + ERC-7984 check. Default true. */
  enrich?: boolean;
  /** Override the registry address (else taken from the address book). */
  registry?: `0x${string}`;
}

/**
 * Read every registry pair for a chain via TanStack Query.
 * Includes revoked pairs (flagged by `status`). Stale-time defaults to 5 min;
 * the registry changes rarely, so we avoid hammering RPC on every render.
 */
export function useRegistryPairs(args: UseRegistryPairsArgs): UseQueryResult<RegistryPair[]> {
  const { client, chainId, enrich = true, pageSize, registry } = args;
  const registryAddress = registry ?? getChainAddresses(chainId).registry;

  return useQuery({
    queryKey: ["cwr", "registry-pairs", chainId, registryAddress, enrich, pageSize ?? null],
    enabled: Boolean(client),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!client) throw new Error("useRegistryPairs: no client");
      const pairs = await readAllPairs(client, registryAddress, pageSize ? { pageSize } : {});
      return enrich ? enrichPairs(client, pairs) : pairs;
    },
  });
}
