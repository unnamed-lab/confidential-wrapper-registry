/** Minimal ERC-20 metadata reads used to enrich registry pairs. */
export const erc20MetadataAbi = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** ERC-165 interface-detection, used to verify the ERC-7984 interface id. */
export const erc165Abi = [
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ type: "bool" }],
  },
] as const;

/**
 * ERC-7984 confidential-token interface id.
 * From PLAN — VERIFY on-chain via supportsInterface during enrichment.
 */
export const ERC7984_INTERFACE_ID = "0x4958f2a4" as const;
