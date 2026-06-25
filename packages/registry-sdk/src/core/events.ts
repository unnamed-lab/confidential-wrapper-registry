import type { Address, PublicClient } from "viem";
import { parseAbiItem } from "viem";

export type RegistryEventType = "registered" | "revoked";

export interface RegistryEvent {
  type: RegistryEventType;
  token: Address;
  wrapper: Address;
  blockNumber: bigint;
  txHash: `0x${string}`;
}

const REGISTERED = parseAbiItem(
  "event ConfidentialTokenRegistered(address tokenAddress, address confidentialTokenAddress)",
);
const REVOKED = parseAbiItem(
  "event ConfidentialTokenRevoked(address tokenAddress, address confidentialTokenAddress)",
);

export interface ReadEventsOptions {
  /** First block to scan. Defaults to (latest - lookback). */
  fromBlock?: bigint;
  /** Window size when fromBlock is omitted. Default 100_000. */
  lookback?: bigint;
  /** getLogs chunk size (public RPCs cap ranges). Default 9_000. */
  chunk?: bigint;
}

/**
 * Read ConfidentialTokenRegistered / Revoked events with block-range chunking
 * (public RPCs cap getLogs ranges). Tolerant of per-chunk failures so one bad
 * range never kills the whole scan. Returns newest-first.
 */
export async function readRegistryEvents(
  client: PublicClient,
  registry: Address,
  opts: ReadEventsOptions = {},
): Promise<RegistryEvent[]> {
  const latest = await client.getBlockNumber();
  const lookback = opts.lookback ?? 100_000n;
  const chunk = opts.chunk ?? 9_000n;
  const from = opts.fromBlock ?? (latest > lookback ? latest - lookback : 0n);

  const events: RegistryEvent[] = [];
  for (let start = from; start <= latest; start += chunk) {
    const end = start + chunk - 1n < latest ? start + chunk - 1n : latest;
    try {
      const [reg, rev] = await Promise.all([
        client.getLogs({ address: registry, event: REGISTERED, fromBlock: start, toBlock: end }),
        client.getLogs({ address: registry, event: REVOKED, fromBlock: start, toBlock: end }),
      ]);
      for (const l of reg) {
        events.push({
          type: "registered",
          token: l.args.tokenAddress as Address,
          wrapper: l.args.confidentialTokenAddress as Address,
          blockNumber: l.blockNumber,
          txHash: l.transactionHash,
        });
      }
      for (const l of rev) {
        events.push({
          type: "revoked",
          token: l.args.tokenAddress as Address,
          wrapper: l.args.confidentialTokenAddress as Address,
          blockNumber: l.blockNumber,
          txHash: l.transactionHash,
        });
      }
    } catch {
      // skip ranges the RPC rejects
    }
  }
  return events.sort((a, b) => Number(b.blockNumber - a.blockNumber));
}
