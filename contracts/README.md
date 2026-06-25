# contracts

Foundry workspace for the **FaucetDistributor** — a Sepolia-only convenience helper that
dispenses fixed drips of the official cTokenMock ERC-20s with an on-chain cooldown.

> Used only if the cTokenMocks do **not** expose a public `mint()`. If they do, the frontend
> mints directly and this contract is unnecessary. Decide on Day 7 after inspecting the mocks.

## Setup

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge build
forge test -vvv
```

## Deploy (Sepolia)

```bash
forge script script/DeployFaucet.s.sol \
  --rpc-url sepolia --broadcast --verify
# then fund it with each cTokenMock and set `faucetDistributor` in
# packages/registry-sdk/src/address-book.ts
```

`DRIP` defaults to `100e6` (6-decimal mocks) and `COOLDOWN` to 8h; override via
`FAUCET_DRIP` / `FAUCET_COOLDOWN` env vars. **Confirm the mock decimals before deploy.**
