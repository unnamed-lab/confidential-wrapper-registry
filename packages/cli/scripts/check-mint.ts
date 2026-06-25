/** Day-7 probe: do the Sepolia cTokenMocks expose a public mint()? Decides the faucet approach. */
import { createPublicClient, http, type Address } from "viem";
import { sepolia } from "viem/chains";
import { ADDRESS_BOOK, SEPOLIA } from "@cwr/registry-sdk";

const rpc = process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const c = createPublicClient({ chain: sepolia, transport: http(rpc) });

const SEL: Record<string, string> = {
  "mint(address,uint256)": "40c10f19",
  "mint(uint256)": "a0712d68",
  "mint()": "1249c58b",
};
const erc20 = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

const mocks = ADDRESS_BOOK[SEPOLIA].cTokenMocks;

for (const addr of mocks as Address[]) {
  const code = (await c.getCode({ address: addr })) ?? "0x";
  let dec = "?";
  let sym = "?";
  try {
    dec = String(await c.readContract({ address: addr, abi: erc20, functionName: "decimals" }));
  } catch {
    /* ignore */
  }
  try {
    sym = await c.readContract({ address: addr, abi: erc20, functionName: "symbol" });
  } catch {
    /* ignore */
  }
  const found = Object.entries(SEL)
    .filter(([, s]) => code.includes(s))
    .map(([k]) => k);
  console.log(`${sym.padEnd(10)} dec=${dec}  ${addr}  mint: ${found.join(", ") || "NONE"}`);
}
