import type { Address, PublicClient } from "viem";
import { registryAbi, erc20MetadataAbi, erc165Abi, ERC7984_INTERFACE_ID } from "../abis/index.js";
import type { RegistryPair, ReadPairsOptions } from "./types.js";
import { deriveStatus } from "./status.js";

const DEFAULT_PAGE_SIZE = 50;

/**
 * Verify a wrapper supports the ERC-7984 interface via ERC-165.
 * Returns false on revert (e.g. contract has no supportsInterface) rather than throwing,
 * so a single bad entry never breaks a whole registry read.
 */
export async function verifyErc7984(client: PublicClient, wrapper: Address): Promise<boolean> {
  try {
    return await client.readContract({
      address: wrapper,
      abi: erc165Abi,
      functionName: "supportsInterface",
      args: [ERC7984_INTERFACE_ID],
    });
  } catch {
    return false;
  }
}

/**
 * Read every registry pair, paging through `getTokenConfidentialTokenPairsSlice`
 * so it scales past a single giant read. Revoked pairs are INCLUDED (isValid=false)
 * — surfacing them is required for coverage; the UI flags them.
 *
 * Pairs are returned un-enriched (no symbols/decimals/interface check). Call
 * `enrichPairs` to fill metadata — kept separate so callers can page the table
 * before paying for N metadata multicalls.
 */
export async function readAllPairs(
  client: PublicClient,
  registry: Address,
  opts: ReadPairsOptions = {},
): Promise<RegistryPair[]> {
  const pageSize = BigInt(opts.pageSize ?? DEFAULT_PAGE_SIZE);

  const length = await client.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsLength",
  });

  const pairs: RegistryPair[] = [];
  for (let from = 0n; from < length; from += pageSize) {
    const to = from + pageSize < length ? from + pageSize : length;
    const slice = await client.readContract({
      address: registry,
      abi: registryAbi,
      functionName: "getTokenConfidentialTokenPairsSlice",
      args: [from, to],
    });
    for (const p of slice) {
      pairs.push({
        token: p.tokenAddress,
        wrapper: p.confidentialTokenAddress,
        isValid: p.isValid,
        status: deriveStatus({ isValid: p.isValid }),
      });
    }
  }
  return pairs;
}

/**
 * Enrich a single pair with token metadata + ERC-7984 verification.
 * Uses multicall when the client supports it; tolerant of individual reverts.
 */
export async function enrichPair(client: PublicClient, pair: RegistryPair): Promise<RegistryPair> {
  const [symbol, name, decimals, wrapperSymbol, supportsERC7984] = await Promise.all([
    safeRead(client, pair.token, erc20MetadataAbi, "symbol"),
    safeRead(client, pair.token, erc20MetadataAbi, "name"),
    safeRead(client, pair.token, erc20MetadataAbi, "decimals"),
    safeRead(client, pair.wrapper, erc20MetadataAbi, "symbol"),
    verifyErc7984(client, pair.wrapper),
  ]);

  const enriched: RegistryPair = {
    ...pair,
    ...(symbol !== undefined ? { tokenSymbol: symbol as string } : {}),
    ...(name !== undefined ? { tokenName: name as string } : {}),
    ...(decimals !== undefined ? { tokenDecimals: Number(decimals) } : {}),
    ...(wrapperSymbol !== undefined ? { wrapperSymbol: wrapperSymbol as string } : {}),
    supportsERC7984,
  };
  enriched.status = deriveStatus(enriched);
  return enriched;
}

export async function enrichPairs(client: PublicClient, pairs: RegistryPair[]): Promise<RegistryPair[]> {
  return Promise.all(pairs.map((p) => enrichPair(client, p)));
}

// deno-lint-ignore no-explicit-any
async function safeRead(
  client: PublicClient,
  address: Address,
  abi: typeof erc20MetadataAbi,
  functionName: "symbol" | "name" | "decimals",
): Promise<unknown> {
  try {
    return await client.readContract({ address, abi, functionName });
  } catch {
    return undefined;
  }
}
