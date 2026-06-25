import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";

export function rpcUrl(chainId: number): string {
  const env = chainId === mainnet.id ? process.env.MAINNET_RPC_URL : process.env.SEPOLIA_RPC_URL;
  if (env) return env;
  return chainId === mainnet.id
    ? "https://ethereum-rpc.publicnode.com"
    : "https://ethereum-sepolia-rpc.publicnode.com";
}

export function requireAccount() {
  const pk = process.env.PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    throw new Error("Set PRIVATE_KEY (or DEPLOYER_PRIVATE_KEY) in your environment to send transactions.");
  }
  return privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`);
}

export function clientsFor(chainId: number): {
  account: PrivateKeyAccount;
  publicClient: PublicClient;
  walletClient: WalletClient;
} {
  const chain = chainId === mainnet.id ? mainnet : sepolia;
  const account = requireAccount();
  const transport = http(rpcUrl(chainId));
  return {
    account,
    publicClient: createPublicClient({ chain, transport }),
    walletClient: createWalletClient({ account, chain, transport }),
  };
}

export type { Address };
