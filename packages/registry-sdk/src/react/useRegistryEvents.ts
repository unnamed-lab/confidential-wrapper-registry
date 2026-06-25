import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PublicClient } from "viem";
import { readRegistryEvents, type RegistryEvent, type ReadEventsOptions } from "../core/events.js";
import { getChainAddresses } from "../address-book.js";

export interface UseRegistryEventsArgs extends ReadEventsOptions {
  client: PublicClient | undefined;
  chainId: number;
}

/**
 * Recent registry activity (ConfidentialTokenRegistered / Revoked), newest-first,
 * via chunked getLogs. Cached for 5 min — events are append-only and rare.
 */
export function useRegistryEvents(args: UseRegistryEventsArgs): UseQueryResult<RegistryEvent[]> {
  const { client, chainId, fromBlock, lookback, chunk } = args;
  const registry = getChainAddresses(chainId).registry;
  return useQuery({
    queryKey: ["cwr", "registry-events", chainId, String(fromBlock ?? null), String(lookback ?? null)],
    enabled: Boolean(client),
    staleTime: 5 * 60_000,
    queryFn: () => {
      if (!client) throw new Error("useRegistryEvents: no client");
      const opts: ReadEventsOptions = {};
      if (fromBlock !== undefined) opts.fromBlock = fromBlock;
      if (lookback !== undefined) opts.lookback = lookback;
      if (chunk !== undefined) opts.chunk = chunk;
      return readRegistryEvents(client, registry, opts);
    },
  });
}
