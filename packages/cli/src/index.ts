#!/usr/bin/env node
/**
 * registry-cli — terminal access to the Zama Confidential Token Wrappers Registry.
 *
 * Read-only commands (list/show/snippet) work today against any RPC.
 * Write commands (wrap/unwrap/balance/faucet) require the Zama v3 SDK + a signer
 * and are wired here but land on the build schedule (Days 4–7). See .ai/TASKS.md.
 */
import { createPublicClient, http, isAddress, type Address } from "viem";
import { mainnet, sepolia } from "viem/chains";
import {
  readAllPairs,
  enrichPairs,
  generateSnippet,
  getChainAddresses,
  type RegistryPair,
  type SnippetFlavor,
} from "@cwr/registry-sdk";

function rpc(chainId: number): string {
  const env =
    chainId === mainnet.id ? process.env.MAINNET_RPC_URL : process.env.SEPOLIA_RPC_URL;
  if (env) return env;
  return chainId === mainnet.id
    ? "https://ethereum-rpc.publicnode.com"
    : "https://ethereum-sepolia-rpc.publicnode.com";
}

function resolveChain(name: string | undefined): { id: number; chain: typeof sepolia } {
  if (name === "mainnet" || name === "1") return { id: mainnet.id, chain: mainnet as never };
  return { id: sepolia.id, chain: sepolia };
}

function client(chainId: number) {
  const { chain } = resolveChain(String(chainId));
  return createPublicClient({ chain, transport: http(rpc(chainId)) });
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function cmdList(args: string[]): Promise<void> {
  const { id } = resolveChain(flag(args, "chain"));
  const { registry } = getChainAddresses(id);
  const c = client(id);
  const pairs = await enrichPairs(c, await readAllPairs(c, registry));
  if (pairs.length === 0) {
    console.log("No pairs found (check the registry address is verified in address-book.ts).");
    return;
  }
  for (const p of pairs) {
    const tag =
      p.status === "active" ? "  active" : p.status === "revoked" ? " REVOKED" : "MISMATCH";
    console.log(`[${tag}] ${(p.tokenSymbol ?? "?").padEnd(8)} ${p.token}  ->  ${p.wrapper}`);
  }
  console.log(`\n${pairs.length} pair(s).`);
}

async function cmdShow(args: string[]): Promise<void> {
  const target = args[0];
  if (!target || !isAddress(target)) return fail("show <token|wrapper-address> [--chain sepolia]");
  const { id } = resolveChain(flag(args, "chain"));
  const { registry } = getChainAddresses(id);
  const c = client(id);
  const pairs = await enrichPairs(c, await readAllPairs(c, registry));
  const lc = target.toLowerCase();
  const p = pairs.find((x) => x.token.toLowerCase() === lc || x.wrapper.toLowerCase() === lc);
  if (!p) return fail(`Not found in registry on chain ${id}: ${target}`);
  console.log(JSON.stringify(p, null, 2));
}

async function cmdSnippet(args: string[]): Promise<void> {
  const wrapper = args[0];
  if (!wrapper || !isAddress(wrapper)) return fail("snippet <wrapper> --flavor viem [--chain sepolia]");
  const { id } = resolveChain(flag(args, "chain"));
  const flavor = (flag(args, "flavor") ?? "viem") as SnippetFlavor;
  const { registry } = getChainAddresses(id);
  const c = client(id);
  const pairs = await enrichPairs(c, await readAllPairs(c, registry));
  const p: RegistryPair | undefined = pairs.find(
    (x) => x.wrapper.toLowerCase() === (wrapper as Address).toLowerCase(),
  );
  if (!p) return fail(`Wrapper not found in registry: ${wrapper}`);
  console.log(generateSnippet(p, flavor, { chainId: id }));
}

function notYet(name: string): void {
  console.log(`\`${name}\` needs the Zama v3 SDK + a signer — scheduled on the build plan (.ai/TASKS.md).`);
}

function fail(msg: string): void {
  console.error(`error: ${msg}`);
  process.exitCode = 1;
}

const HELP = `registry-cli — Zama Confidential Token Wrappers Registry

Usage:
  registry-cli list [--chain sepolia|mainnet]
  registry-cli show <token|wrapper> [--chain ...]
  registry-cli snippet <wrapper> [--flavor wagmi|viem|ethers] [--chain ...]
  registry-cli wrap <wrapper> <amount>     (coming: Day 4)
  registry-cli unwrap <wrapper> <amount>   (coming: Day 4)
  registry-cli balance <wrapper>           (coming: Day 5)
  registry-cli faucet <token>              (coming: Day 7)
`;

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "list":
      return cmdList(rest);
    case "show":
      return cmdShow(rest);
    case "snippet":
      return cmdSnippet(rest);
    case "wrap":
    case "unwrap":
    case "balance":
    case "faucet":
      return notYet(cmd);
    case "help":
    case undefined:
    case "--help":
    case "-h":
      console.log(HELP);
      return;
    default:
      fail(`unknown command: ${cmd}\n\n${HELP}`);
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
