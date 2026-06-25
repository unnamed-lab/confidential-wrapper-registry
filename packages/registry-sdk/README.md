# @cwr/registry-sdk

Typed reader, React hooks, and integration-snippet generator for the **Zama Confidential Token Wrappers Registry** (ERC-20 ↔ ERC-7984). Framework-agnostic core + a thin React layer over the Zama v3 SDK.

> This package is the reusable toolkit at the heart of the Confidential Wrapper Registry app — built so another developer could `pnpm add @cwr/registry-sdk` and integrate any registry pair in minutes.

## Install

```bash
pnpm add @cwr/registry-sdk viem
# React layer also needs:
pnpm add @tanstack/react-query react @zama-fhe/react-sdk
```

## Core (no React)

```ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { readAllPairs, enrichPairs, getChainAddresses } from "@cwr/registry-sdk";

const client = createPublicClient({ chain: sepolia, transport: http() });
const { registry } = getChainAddresses(sepolia.id);

const pairs = await readAllPairs(client, registry);   // includes revoked pairs (flagged)
const enriched = await enrichPairs(client, pairs);     // symbols, decimals, ERC-7984 check
```

| Export | Purpose |
|---|---|
| `readAllPairs(client, registry, opts?)` | Paged read of every pair via `getTokenConfidentialTokenPairsSlice`. Includes revoked. |
| `enrichPair` / `enrichPairs` | Adds token symbol/name/decimals + `supportsInterface(0x4958f2a4)`. |
| `verifyErc7984(client, wrapper)` | ERC-165 check; returns `false` on revert. |
| `deriveStatus(pair)` | `"active" \| "revoked" \| "interface-mismatch"`. |
| `generateSnippet(pair, flavor, opts)` | Copy-paste `wagmi` / `viem` / `ethers` integration code. |
| `ADDRESS_BOOK` / `getChainAddresses` | Per-chain registry/faucet/cToken addresses. |

## React hooks

> Implemented across the build schedule — see `.ai/TASKS.md`. Status keys are a
> discriminated union (`idle | pending | awaiting-signature | confirming | success | error`)
> so the UI renders precise states, never a bare spinner.

`useRegistryPairs` · `usePair` · `useWrap` · `useUnwrap` · `useDecryptBalance` · `useBatchDecrypt` ⭐ · `useFaucet` · `useRegistryEvents`

## Snippet generator

```ts
import { generateSnippet } from "@cwr/registry-sdk";
const code = generateSnippet(pair, "viem", { chainId: 11155111, amount: "5" });
```

## License

BSD-3-Clause-Clear.
