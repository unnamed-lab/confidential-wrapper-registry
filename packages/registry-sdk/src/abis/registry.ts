/**
 * ABI for Zama's ConfidentialTokenWrappersRegistry.
 *
 * Source: zama-ai/protocol-apps `ConfidentialTokenWrappersRegistry.sol`.
 * Signatures transcribed from PLAN §4.1 — VERIFY against the deployed bytecode
 * on Day 2 (the deployed registry may expose a superset; trim/extend as needed).
 */
export const registryAbi = [
  // --- Discovery ---
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsSlice",
    stateMutability: "view",
    inputs: [
      { name: "fromIndex", type: "uint256" },
      { name: "toIndex", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPair",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  // --- Lookups ---
  {
    type: "function",
    name: "getConfidentialTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "tokenAddress", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "confidentialTokenAddress", type: "address" },
    ],
  },
  {
    type: "function",
    name: "getTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "confidentialTokenAddress", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "tokenAddress", type: "address" },
    ],
  },
  {
    type: "function",
    name: "isConfidentialTokenValid",
    stateMutability: "view",
    inputs: [{ name: "confidentialTokenAddress", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  // --- Events (index for the Health dashboard) ---
  {
    type: "event",
    name: "ConfidentialTokenRegistered",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: false },
      { name: "confidentialTokenAddress", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ConfidentialTokenRevoked",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: false },
      { name: "confidentialTokenAddress", type: "address", indexed: false },
    ],
  },
] as const;
