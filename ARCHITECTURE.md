# Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  apps/web  (Next.js 14 App Router)                           │
│  Registry Explorer · Pair detail · Portfolio · Faucet · Health│
│         │ imports                                            │
│         ▼                                                    │
│  packages/registry-sdk  (framework-agnostic core + React)    │
│  readAllPairs · enrichPair · verifyErc7984 · deriveStatus    │
│  hooks · generateSnippet · ABIs · address-book               │
│         │ wraps                                              │
│         ▼                                                    │
│  @zama-fhe/sdk + @zama-fhe/react-sdk  (official v3 SDK)       │
│  createWrappedToken().shield / unshield / balanceOf          │
└──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
  Registry contract            Zama Relayer / Gateway / KMS
  (Sepolia + mainnet)          (user-decryption, re-encryption)

  packages/cli  ──uses──▶  registry-sdk core
  contracts/    ──▶  FaucetDistributor (Sepolia only)
```

## Layers

### `packages/registry-sdk` — the reusable toolkit
- **core/** — chain-agnostic registry reader. `readAllPairs` pages via
  `getTokenConfidentialTokenPairsSlice` (scales, includes revoked). `enrichPair` adds
  token metadata + `supportsInterface(0x4958f2a4)`. `deriveStatus` →
  `active | revoked | interface-mismatch`.
- **react/** — TanStack-Query hooks over the core + the Zama v3 SDK. Every hook returns a
  discriminated-union status so the UI never shows a bare spinner.
- **snippets/** — `generateSnippet(pair, flavor)` emits wagmi/viem/ethers integration code.
- **address-book.ts** — single source of truth for addresses, per chain, with a `verified` flag.

### `apps/web`
Next.js App Router. Routes map 1:1 to product surfaces (Explorer / Pair / Portfolio / Faucet /
Health). Wallet via wagmi + viem + RainbowKit; FHE via `<ZamaProvider>`.

### `packages/cli`
Thin binary over `registry-sdk` core — extensibility made literal.

### `contracts`
Foundry. `FaucetDistributor` is an optional Sepolia convenience helper (used only if the
official cTokenMocks don't expose public mint). Cooldown enforced on-chain.

## Key data flows

**Wrap:** pick pair → `useWrap` → `sdk.createWrappedToken(wrapper).shield(amount)` (approve +
deposit) → optimistic "pending decryption" → resolve via cached permit.

**Balance read (the hard part):** read ciphertext handle → ensure one EIP-712 permit (persist
IndexedDB) → Relayer/KMS re-encrypt under user pubkey → decrypt locally → cache by
`(chainId, wrapper, handle)` → invalidate on new tx.

**Batch decryption ⭐:** collect every handle across the user's pairs → **one** signature →
decrypt all → portfolio renders with per-handle progress.

See [`PLAN.md`](PLAN.md) for the full spec.
