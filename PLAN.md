# Confidential Wrapper Registry App — Implementation Plan

**Bounty:** Zama Developer Program, Mainnet Season 3 — Bounty Track
**Deadline:** July 7, 2026 (23:59 AOE)
**Thesis:** Don't build "another wrap/unwrap wallet." Build the *canonical registry product + a reusable developer toolkit* that Zama would link from their own docs. Match the crowd on wrapping (table stakes), win on the four axes they neglect: registry-as-product, developer tooling, batch user-decryption, and production polish.

> This document is the single source of truth for the build. It maps every deliverable to a judging criterion, specifies the architecture down to file and function level, and gives a day-by-day schedule that fits the deadline. See `.ai/STATE.md` for live status.

---

## 0. Strategic framing (read this first)

The idea is fixed — everyone builds the same app. Winning is purely about execution against the six judging criteria:

| Criterion | Where most submissions lose points | How this plan wins |
|---|---|---|
| **Coverage** | Hardcode the ~7 known tokens; ignore revoked pairs and mainnet | Read the registry dynamically across **Sepolia + mainnet**, surface revoked pairs with validity state, verify the ERC-7984 interface on-chain |
| **Correctness** | Naive one-at-a-time decryption; broken EIP-712 flow | Wrap the **v3 SDK** cleanly; **batch user-decryption** (one signature → whole portfolio); cached permits |
| **Extensibility** | Monolithic frontend, nothing reusable | Ship a typed **`registry-sdk` package + CLI + per-pair code-snippet generator** — the Bounty Track's literal mandate ("templates and resources") |
| **UX** | Janky loading states during slow FHE decryption | Skeletons, optimistic UI, batch progress, empty/error states, keyboard + a11y |
| **Code quality** | No tests, no types, no docs | Full test suite, strict TS, architecture doc, conventional commits |
| **Production-readiness** | "Works on my machine" demo | Forkable template, one-command deploy, CI, env validation, error boundaries |

**The single biggest separator is the developer toolkit.** Almost everyone chasing the wrap button will skip it.

---

## 1. Scope & deliverables

### 1.1 Required (table stakes — must be flawless)
1. Surface **every** ERC-20 ↔ ERC-7984 wrapper pair from the official Registry, on **Sepolia and Ethereum mainnet**.
2. **Wrap** any registry pair (public ERC-20 → confidential ERC-7984).
3. **Unwrap** any registry pair (confidential → public).
4. **Decrypt** any ERC-7984 balance via the **EIP-712 user-decryption** flow.
5. **Faucet** for the official Sepolia `cTokenMock` ERC-20s.

### 1.2 Differentiators (where you actually win)
6. **`registry-sdk`** — typed hooks/core package wrapping the registry + Zama v3 SDK.
7. **CLI** — query the registry, wrap/unwrap, drip the faucet from the terminal.
8. **Per-pair integration snippet generator** — copy-paste wagmi/viem/ethers code for each pair.
9. **Batch user-decryption** — one signature decrypts the user's whole confidential portfolio.
10. **Registry Health dashboard** — index `ConfidentialTokenRegistered` / `ConfidentialTokenRevoked` events, show a live feed, flag anomalies.
11. **Forkable template** — one-command deploy, documented, CI-green.

### 1.3 Explicit non-goals (protect your time)
- No custom AMM/swap, no new token standards, no bridging.
- Don't re-deploy the registry or wrappers — consume the official ones.
- Don't gold-plate the faucet contract.

---

## 2. Architecture overview

A **pnpm monorepo** with three workspaces. This structure *is* a credibility signal to judges.

```
apps/web (Next.js 14)  ──imports──▶  packages/registry-sdk (core + React)  ──wraps──▶  @zama-fhe/sdk + react-sdk
packages/cli  ──uses──▶  packages/registry-sdk/core
contracts/  ──▶  FaucetCToken mocks + deploy scripts (Sepolia only)
```

**Data flow for a wrap:** pick pair → `useWrap(pair)` → SDK approve → wrapper deposit → encrypted balance on-chain → optimistic "pending decryption" → resolve via cached permit.

**Data flow for a balance read:** read ciphertext handle → if no valid permit, one EIP-712 signature (persist IndexedDB) → Relayer requests re-encryption from KMS under user pubkey → decrypt locally → cache cleartext by handle → invalidate on new tx.

---

## 3. Tech stack & key decisions

| Layer | Choice | Why |
|---|---|---|
| SDK | `@zama-fhe/sdk` + `@zama-fhe/react-sdk` v3 | New default. `createWrappedToken().shield/unshield/balanceOf`, TanStack hooks, cached decryption + one-signature permits. |
| Starter base | `zama-ai/fhevm-react-template` | Wires `ZamaProvider` + `RelayerWeb` (Sepolia) / `RelayerCleartext` (localhost). |
| Framework | Next.js 14 (App Router) + React 18 | |
| Wallet | wagmi + viem + RainbowKit | `createConfig` from `@zama-fhe/react-sdk/wagmi`, into `<ZamaProvider config>`. |
| Data/cache | TanStack React Query | SDK peer dep; reuse for registry reads + decryption cache. |
| Contracts | Foundry | |
| Styling | Tailwind + shadcn/ui | |
| Persistence | `indexedDBStorage` (from SDK) | permits + decrypted-handle cache. |
| Lang | TypeScript strict | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. |

> **Verify before coding:** pull live addresses (Registry, wrappers, cTokenMocks) from the Zama addresses directory and confirm on-chain. Keep them in `address-book.ts`. See `.ai/VERIFIED-FACTS.md`.

---

## 4. On-chain layer

### 4.1 Registry contract (consume, read-only)
`TokenWrapperPair { address tokenAddress; address confidentialTokenAddress; bool isValid; }`

```solidity
getTokenConfidentialTokenPairsLength() returns (uint256)
getTokenConfidentialTokenPairsSlice(uint256 fromIndex, uint256 toIndex) returns (TokenWrapperPair[]) // [from, to)
getTokenConfidentialTokenPair(uint256 index) returns (TokenWrapperPair)
getTokenConfidentialTokenPairs() returns (TokenWrapperPair[]) // includes revoked
getConfidentialTokenAddress(address erc20) returns (bool isValid, address wrapper)
getTokenAddress(address wrapper) returns (bool isValid, address erc20)
isConfidentialTokenValid(address wrapper) returns (bool)
getTokenIndex(address token) returns (uint256) // reverts TokenNotRegistered
event ConfidentialTokenRegistered(address tokenAddress, address confidentialTokenAddress)
event ConfidentialTokenRevoked(address tokenAddress, address confidentialTokenAddress)
```

**Coverage rules:** page with `...Slice(from,to)`; always render revoked pairs visibly flagged; verify ERC-165 + ERC-7984 interface id `0x4958f2a4` via `supportsInterface`; badge `Verified ERC-7984` vs `Interface mismatch`.

### 4.2 Wrapper contract (consume)
`ERC7984ERC20Wrapper` — 1:1, free both ways. Use `sdk.createWrappedToken(addr).shield/unshield`. Only drop to raw ABI if SDK doesn't expose a needed behavior.

### 4.3 Faucet helper (deploy — Sepolia only)
- **A. If cTokenMocks expose public mint:** no new contract; frontend calls `mint(to, amount)` with client-side rate-limit.
- **B. If not:** thin `FaucetDistributor` holding balances, fixed drips, on-chain cooldown:

```solidity
contract FaucetDistributor {
    uint256 public constant DRIP = 100e6;
    uint256 public constant COOLDOWN = 8 hours;
    mapping(address => mapping(address => uint256)) public nextClaim;
    event Dripped(address indexed token, address indexed to, uint256 amount);
    function drip(address token) external {
        require(block.timestamp >= nextClaim[token][msg.sender], "cooldown");
        nextClaim[token][msg.sender] = block.timestamp + COOLDOWN;
        require(IERC20(token).transfer(msg.sender, DRIP), "transfer failed");
        emit Dripped(token, msg.sender, DRIP);
    }
}
```

---

## 5. The reusable toolkit — `packages/registry-sdk` (the differentiator)

### 5.1 Core (`src/core`)
```ts
export interface RegistryPair {
  token: Address; wrapper: Address; isValid: boolean;
  tokenSymbol?: string; tokenDecimals?: number; wrapperSymbol?: string;
  supportsERC7984?: boolean;
  status: "active" | "revoked" | "interface-mismatch";
}
export async function readAllPairs(client, registry, opts?: { pageSize?: number }): Promise<RegistryPair[]>;
export async function enrichPair(client, pair): Promise<RegistryPair>;
export async function verifyErc7984(client, wrapper): Promise<boolean>;
```

### 5.2 React hooks (`src/react`)
```
useRegistryPairs({ chainId })   usePair(tokenOrWrapper)
useWrap(pair)   useUnwrap(pair)
useDecryptBalance(wrapper)   useBatchDecrypt(wrappers[])   ⭐
useFaucet(token)   useRegistryEvents({ chainId })
```
Every hook returns discriminated-union status: `idle | pending | awaiting-signature | confirming | success | error`.

### 5.3 Snippet generator (`src/snippets`)
```ts
generateSnippet(pair, flavor: "wagmi" | "viem" | "ethers"): string
```

### 5.4 Address book (`src/address-book.ts`)
```ts
export const ADDRESS_BOOK = {
  11155111: { registry: "0x…", faucetDistributor: "0x…", cTokenMocks: ["0x…"] },
  1:        { registry: "0x…" },
} as const;
```

### 5.5 CLI (`packages/cli`)
```
registry-cli list --chain sepolia
registry-cli show <token|wrapper>
registry-cli wrap <wrapper> <amount>
registry-cli unwrap <wrapper> <amount>
registry-cli balance <wrapper>
registry-cli faucet <token>
registry-cli snippet <wrapper> --flavor viem
```

---

## 6. Frontend app — `apps/web`

Routes: `/` Registry Explorer · `/pair/[wrapper]` detail+snippet · `/portfolio` batch-decrypt (hero) · `/faucet` · `/health`.

Components: `RegistryTable`, `WrapPanel`/`UnwrapPanel`, `BalanceCell`, `BatchDecryptBar`, `SnippetDialog`, `CooldownButton`, `AnomalyBadge`, `NetworkSwitch`.

UX states that win: loading skeletons; distinct "awaiting signature"; per-handle decrypt progress; cached affordance; empty; actionable errors + retry + error boundaries; optimistic post-wrap.

A11y: keyboard nav, focus traps, ARIA, contrast-safe badges, reduced-motion, dark mode.

---

## 7. User-decryption flow (correctness centerpiece)

**Single:** read handle → ensure EIP-712 permit (one sig, persist IndexedDB) → Relayer/KMS re-encrypt under user pubkey → decrypt locally → cache by `(chainId, wrapper, handle)` → invalidate on new tx.

**Batch ⭐:** collect every handle across the user's pairs → **one** signature → decrypt all → "Decrypt entire portfolio (1 signature)" with progress. Competitors prompt per token.

**Permit/session:** reuse SDK one-signature permit; show active/expiry; "lock" action clears cleartext+permit; never log decrypted values.

---

## 8. Faucet (Sepolia)
List each cTokenMock (symbol, balance, Drip). On-chain or guarded cooldown + live countdown. Gasless drip if relayer can sponsor. After drip → "wrap this now" CTA deep-link.

## 9. Registry Health dashboard
Index `ConfidentialTokenRegistered`/`Revoked` from deploy block via chunked `getLogs`; cache. Show live feed, active/revoked counts per chain, anomaly flags (revoked-but-nonzero, interface mismatch, duplicates, typosquats). Real examples captured in `.ai/VERIFIED-FACTS.md`.

## 10. Testing
Foundry (faucet) · Vitest (core: pagination, verifyErc7984, snippets, status) · RTL (hook status transitions, cache) · anvil + RelayerCleartext integration (wrap→balance→unwrap, batch) · Playwright happy-path · tsc strict + ESLint + Prettier in CI.

## 11. Production-readiness checklist
One-command dev; one-command deploy; `.env.example` + zod env validation; CI install→typecheck→lint→test→build; error boundaries; network guard; relayer/KMS timeout handling; no secrets in bundle; ARCHITECTURE.md + per-package READMEs; conventional commits + tagged `v1.0.0`; license (BSD-3-Clause-Clear).

## 12. Repo structure
```
apps/web/ (Next.js 14)
packages/registry-sdk/ {core, react, snippets, address-book.ts, abis, README}
packages/cli/
contracts/ {src/FaucetDistributor.sol, script/, test/}
.github/workflows/ci.yml  ARCHITECTURE.md  README.md  .env.example  pnpm-workspace.yaml
```

## 13. Day-by-day (12 days → July 7, start ~June 25)
1 Foundations · 2 Registry reads · 3 Explorer UI · 4 Wrap/unwrap · 5 Single decrypt (riskiest) · 6 Batch decrypt · 7 Faucet · 8 Snippets+CLI · 9 Health · 10 Tests+CI · 11 Polish · 12 Submission.
> If behind: cut Health then mainnet-coverage BEFORE batch decryption or toolkit. Never cut tests entirely.

## 14. Submission package
README (pitch→live link→quickstart→features mapped to criteria→GIFs→architecture→decryption explainer); `registry-sdk/README.md` as a real lib doc; demo video ≤3min (faucet→wrap→batch-decrypt→snippet→unwrap, show a revoked pair + one-sig batch); forum post; X post tagging @zama #ZamaDeveloperProgram.

## 15. Key facts to confirm (see `.ai/VERIFIED-FACTS.md`)
Registry address + deploy block (both chains); wrapper + underlying addresses; cTokenMock addresses/decimals/mint policy; ERC-7984 interface id `0x4958f2a4`; relayer/gateway/KMS/ACL addresses (SDK presets).

---
*Recap: be flawless on wrap/unwrap, then win on registry coverage, the developer toolkit, and one-signature batch decryption.*
