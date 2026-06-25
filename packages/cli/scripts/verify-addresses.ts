/**
 * One-off on-chain verifier (Day 2). Confirms the registry addresses respond to our
 * ABI, prints pair counts, and checks the ERC-7984 interface id on a sample wrapper.
 * Run: pnpm --filter @cwr/cli exec tsx scripts/verify-addresses.ts
 */
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { registryAbi, erc165Abi, ERC7984_INTERFACE_ID, erc20MetadataAbi } from "@cwr/registry-sdk";

const REGISTRY = {
  [sepolia.id]: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
  [mainnet.id]: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
} as const;

const RPC = {
  [sepolia.id]: process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
  [mainnet.id]: process.env.MAINNET_RPC_URL ?? "https://ethereum-rpc.publicnode.com",
} as const;

async function check(chainId: 1 | 11155111, chain: typeof sepolia | typeof mainnet) {
  const client = createPublicClient({ chain: chain as never, transport: http(RPC[chainId]) });
  const registry = REGISTRY[chainId];
  console.log(`\n=== chain ${chainId} (${chain.name}) registry ${registry} ===`);

  const length = await client.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsLength",
  });
  console.log(`pairs length: ${length}`);

  const to = length < 5n ? length : 5n;
  const slice = await client.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsSlice",
    args: [0n, to],
  });
  for (const p of slice) {
    let sym = "?";
    try {
      sym = (await client.readContract({
        address: p.tokenAddress,
        abi: erc20MetadataAbi,
        functionName: "symbol",
      })) as string;
    } catch {
      /* ignore */
    }
    let erc7984 = false;
    try {
      erc7984 = await client.readContract({
        address: p.confidentialTokenAddress,
        abi: erc165Abi,
        functionName: "supportsInterface",
        args: [ERC7984_INTERFACE_ID],
      });
    } catch {
      /* ignore */
    }
    console.log(
      `  ${sym.padEnd(10)} valid=${String(p.isValid).padEnd(5)} erc7984=${erc7984}  ${p.tokenAddress} -> ${p.confidentialTokenAddress}`,
    );
  }
}

async function main() {
  await check(sepolia.id, sepolia);
  await check(mainnet.id, mainnet);
  console.log("\nDONE.");
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
