# Confidential Wrapper Registry

> The canonical product + developer toolkit for Zama's official **ERC-20 ↔ ERC-7984** confidential token wrappers. Surface every registry pair on Sepolia & mainnet, wrap/unwrap, decrypt confidential balances with **one signature**, and integrate any pair in minutes.
>
> Submission for the **Zama Developer Program — Mainnet Season 3, Bounty Track**.

[![CI](https://github.com/unnamed-lab/confidential-wrapper-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/unnamed-lab/confidential-wrapper-registry/actions/workflows/ci.yml)

---

## Why this is more than a wrap button

| Judging axis | What we ship |
|---|---|
| **Coverage** | Dynamic registry read across **Sepolia + mainnet**, revoked pairs surfaced & flagged, on-chain ERC-7984 interface verification |
| **Correctness** | Clean v3-SDK integration; **batch user-decryption** (one signature → whole portfolio); cached EIP-712 permits |
| **Extensibility** | A reusable [`@cwr/registry-sdk`](packages/registry-sdk) package **+ CLI + per-pair snippet generator** |
| **UX** | Skeletons, explicit async states for slow FHE decryption, optimistic wraps, a11y + dark mode |
| **Code quality** | Strict TS, Vitest + Foundry tests, green CI, conventional commits |
| **Production-readiness** | Forkable template, one-command dev, env validation, error boundaries |

## Monorepo layout

```
apps/web              Next.js 14 app — Explorer · Pair detail · Portfolio · Faucet · Health
packages/registry-sdk Framework-agnostic core + React hooks + snippet generator  ⭐ the toolkit
packages/cli          registry-cli — list / show / wrap / unwrap / balance / faucet / snippet
contracts             Foundry — FaucetDistributor (Sepolia convenience helper)
```

## Quickstart

```bash
pnpm install
cp .env.example .env        # add an RPC + WalletConnect id
pnpm dev                    # apps/web
# or drive the registry from the terminal:
pnpm cli list --chain sepolia
```

## Status

Early build — see [`PLAN.md`](PLAN.md) for the full spec and the day-by-day schedule.
The reusable toolkit (`@cwr/registry-sdk`) core + snippet generator + CLI are live and tested;
the web app and the on-chain decryption flow are landing next.

## License

[BSD-3-Clause-Clear](LICENSE) — matching Zama's open-source licensing.
