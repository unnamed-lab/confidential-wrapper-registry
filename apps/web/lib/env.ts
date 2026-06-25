import { z } from "zod";

/**
 * Runtime env validation — fails fast with a clear message instead of producing
 * a broken app. Only NEXT_PUBLIC_* vars are available in the browser bundle.
 */
const schema = z.object({
  // RainbowKit/WalletConnect. A placeholder keeps local dev working without an account;
  // set a real id for production (wallet deep-linking + mobile).
  NEXT_PUBLIC_WALLETCONNECT_ID: z.string().min(1).default("cwr_dev_placeholder"),
  NEXT_PUBLIC_SEPOLIA_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAINNET_RPC_URL: z.string().url().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_WALLETCONNECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
  NEXT_PUBLIC_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
  NEXT_PUBLIC_MAINNET_RPC_URL: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${parsed.error.toString()}`);
}

export const env = parsed.data;
