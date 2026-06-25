/**
 * FHE write commands (wrap/unwrap/balance) over the Zama v3 SDK Node path.
 * Requires PRIVATE_KEY (a funded Sepolia key) in the environment.
 *
 * The SDK is imported dynamically so the heavy FHE/WASM runtime only loads when an
 * FHE command is actually invoked — `list`/`show`/`snippet`/`faucet` stay fast.
 */
import { formatUnits, parseUnits, type Address } from "viem";
import { erc20MetadataAbi } from "@cwr/registry-sdk";
import { clientsFor } from "./signer.js";

async function sdkFor(chainId: number) {
  const { ZamaSDK, memoryStorage } = await import("@zama-fhe/sdk");
  const { createConfig } = await import("@zama-fhe/sdk/viem");
  const { node } = await import("@zama-fhe/sdk/node");
  const chains = await import("@zama-fhe/sdk/chains");

  const { publicClient, walletClient, account } = clientsFor(chainId);
  const config = createConfig({
    chains: [chains.sepolia, chains.mainnet],
    publicClient,
    walletClient,
    relayers: { [chains.sepolia.id]: node(), [chains.mainnet.id]: node() },
    storage: memoryStorage,
  });
  return { sdk: new ZamaSDK(config), account, publicClient };
}

async function wrapperDecimals(publicClient: Awaited<ReturnType<typeof sdkFor>>["publicClient"], wrapper: Address) {
  try {
    return Number(
      await publicClient.readContract({ address: wrapper, abi: erc20MetadataAbi, functionName: "decimals" }),
    );
  } catch {
    return 18;
  }
}

export async function cliWrap(chainId: number, wrapper: Address, amount: string): Promise<void> {
  const { sdk, publicClient } = await sdkFor(chainId);
  const decimals = await wrapperDecimals(publicClient, wrapper);
  const wt = sdk.createWrappedToken(wrapper);
  console.log(`Wrapping ${amount} (decimals ${decimals}) into ${wrapper} …`);
  const res = await wt.shield(parseUnits(amount, decimals));
  console.log("tx:", res.txHash ?? res);
}

export async function cliUnwrap(chainId: number, wrapper: Address, amount: string): Promise<void> {
  const { sdk, publicClient } = await sdkFor(chainId);
  const decimals = await wrapperDecimals(publicClient, wrapper);
  const wt = sdk.createWrappedToken(wrapper);
  console.log(`Unwrapping ${amount} from ${wrapper} …`);
  const res = await wt.unshield(parseUnits(amount, decimals));
  console.log("tx:", res.txHash ?? res);
}

export async function cliBalance(chainId: number, wrapper: Address): Promise<void> {
  const { sdk, account, publicClient } = await sdkFor(chainId);
  const decimals = await wrapperDecimals(publicClient, wrapper);
  const wt = sdk.createWrappedToken(wrapper);
  console.log(`Decrypting your balance of ${wrapper} (one signature)…`);
  const value = await wt.balanceOf(account.address);
  console.log(`balance: ${formatUnits(value, decimals)}`);
}
