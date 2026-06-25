# Confidential Wrapper Registry

> The canonical product **+ developer toolkit** for Zama's official **ERC-20 ↔ ERC-7984** confidential token wrappers. Surface every registry pair on Sepolia & mainnet, wrap/unwrap, decrypt your whole confidential portfolio with **one signature**, and integrate any pair in minutes.
>
> Submission for the **Zama Developer Program — Mainnet Season 3, Bounty Track**.

[![CI](https://github.com/unnamed-lab/confidential-wrapper-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/unnamed-lab/confidential-wrapper-registry/actions/workflows/ci.yml)
&nbsp;·&nbsp; pnpm monorepo · Next.js 14 · `@zama-fhe/sdk` v3 · wagmi v3 · Foundry · BSD-3-Clause-Clear

---

## What it does

| | Surface | Wrap | Unwrap | Decrypt | Faucet |
|---|---|---|---|---|---|
| **Web app** | Explorer (both chains, revoked + interface badges) | ✅ | ✅ | ✅ single **& one-signature batch** | ✅ Sepolia |
| **CLI** | `list` / `show` | `wrap` | `unwrap` | `balance` | `faucet` |

Plus the parts most submissions skip — and where this one wins:

- **🧰 Reusable toolkit** — [`@cwr/registry-sdk`](packages/registry-sdk): a framework-agnostic registry reader, React hooks, an integration **snippet generator**, and an **anomaly detector**, all consumed by both the app and the CLI.
- **✍️ One-signature batch decryption** — the `/portfolio` page decrypts every confidential balance you hold across the registry with a **single** EIP-712 signature (most wallets prompt once per token).
- **🩺 Registry Health dashboard** — coverage counts + on-chain anomaly detection (revoked-but-present, interface mismatches, duplicate symbols, typosquats) that flags the real suspicious mainnet/Sepolia entries reported on the Zama forum.
- **⌨️ A CLI that actually transacts** — `faucet`/`wrap`/`unwrap`/`balance` run end-to-end against Sepolia (verified live).

## How each judging criterion is met

| Criterion | What we ship |
|---|---|
| **Coverage** | Dynamic, paged registry read across **Sepolia + mainnet**; revoked pairs surfaced and flagged; on-chain ERC-7984 (`0x4958f2a4`) verification per wrapper |
| **Correctness** | Clean Zama v3-SDK integration; **batch user-decryption** with cached one-signature permits; addresses verified on-chain (not hardcoded from memory) |
| **Extensibility** | `@cwr/registry-sdk` package + `registry-cli` + per-pair wagmi/viem/ethers snippet generator |
| **UX** | Skeletons, explicit `awaiting-signature` / `decrypting` states, optimistic wraps, faucet cooldown, empty/error states, dark mode, reduced-motion, keyboard/ARIA |
| **Code quality** | Strict TS (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Vitest + Foundry tests, green CI, conventional commits |
| **Production-readiness** | One-command dev, zod env validation, error boundaries, network guards, forkable template |

## Monorepo layout

```
apps/web              Next.js 14 — Explorer · Pair detail · Portfolio · Faucet · Health
packages/registry-sdk Framework-agnostic core + React hooks + snippet gen + anomaly detector  ⭐
packages/cli          registry-cli — list / show / snippet / faucet / wrap / unwrap / balance
contracts             Foundry — FaucetDistributor (optional Sepolia helper, tested)
```

## Quickstart

```bash
pnpm install
cp .env.example .env          # optional: add your own RPCs + WalletConnect id
pnpm dev                      # → http://localhost:3000
```

Drive the registry from your terminal:

```bash
pnpm --filter @cwr/cli build
node packages/cli/dist/index.js list --chain sepolia        # all pairs, enriched
node packages/cli/dist/index.js snippet <wrapper> --flavor viem

# write commands need PRIVATE_KEY (a funded Sepolia key) in your env:
node packages/cli/dist/index.js faucet <token> --amount 1000
node packages/cli/dist/index.js wrap <wrapper> 100
node packages/cli/dist/index.js balance <wrapper>           # user-decrypts (one signature)
```

## How the user-decryption flow works

1. Read the ciphertext handle from the ERC-7984 wrapper.
2. Ensure a valid **EIP-712 permit** for the user (one signature via `useGrantPermit`; skipped if one is already cached — this is what makes batch decryption a single prompt).
3. The relayer requests re-encryption under the user's key from the KMS; the value is decrypted locally and cached by handle.
4. The cache is invalidated when a new tx changes the balance.

The `/portfolio` page collects **every** wrapper handle the wallet holds and authorizes them under **one** permit → one signature decrypts the whole portfolio.

## Verified on-chain

Registry + cToken addresses were confirmed on-chain (`packages/cli/scripts/verify-addresses.ts`):
Sepolia registry `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` (8 pairs), Ethereum mainnet `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` (9 pairs). The full CLI flow (faucet → wrap → decrypt) was executed live on Sepolia.

## Docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — layers, data flows, decryption design
- [`packages/registry-sdk/README.md`](packages/registry-sdk/README.md) — the toolkit, as a library doc
- [`PLAN.md`](PLAN.md) — full spec + day-by-day build

## License

[BSD-3-Clause-Clear](LICENSE) — matching Zama's open-source licensing.
