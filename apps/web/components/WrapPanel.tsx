"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useShield, useUnshield } from "@zama-fhe/react-sdk";
import type { RegistryPair } from "@cwr/registry-sdk/react";
import type { AppChainId } from "@/lib/chains";

type Mode = "wrap" | "unwrap";

/**
 * Wrap (shield) / unwrap (unshield) panel for a single pair.
 * FHE wrap/unwrap is wired for Sepolia; on other chains we prompt a network switch.
 */
export function WrapPanel({ pair, chainId }: { pair: RegistryPair; chainId: AppChainId }) {
  const [mode, setMode] = useState<Mode>("wrap");
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const decimals = pair.tokenDecimals ?? 18;
  const shield = useShield({ address: pair.wrapper, optimistic: true });
  const unshield = useUnshield(pair.wrapper);
  const active = mode === "wrap" ? shield : unshield;

  const fheReady = chainId === sepolia.id;
  const onWrongChain = isConnected && walletChainId !== chainId;

  let parsed: bigint | null = null;
  try {
    parsed = amount.trim() ? parseUnits(amount.trim(), decimals) : null;
  } catch {
    parsed = null;
  }

  async function submit() {
    if (!parsed || parsed <= 0n) return;
    if (mode === "wrap") {
      await shield.mutateAsync({ amount: parsed, approvalStrategy: "exact" });
    } else {
      await unshield.mutateAsync({ amount: parsed });
    }
    setAmount("");
  }

  const disabled = !isConnected || !fheReady || onWrongChain || !parsed || parsed <= 0n || active.isPending;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex gap-1">
        {(["wrap", "unwrap"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm capitalize transition ${
              mode === m ? "bg-white/10 text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <label className="block text-xs text-white/50" htmlFor="wrap-amount">
        Amount ({mode === "wrap" ? (pair.tokenSymbol ?? "token") : (pair.wrapperSymbol ?? "confidential")})
      </label>
      <input
        id="wrap-amount"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0"
        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-white/30"
      />

      <button
        onClick={submit}
        disabled={disabled}
        className="mt-3 w-full rounded-md bg-[#7c5cff] px-3 py-2 text-sm font-medium text-white transition enabled:hover:bg-[#6b4ce0] disabled:opacity-40"
      >
        {active.isPending
          ? mode === "wrap"
            ? "Shielding…"
            : "Unshielding…"
          : mode === "wrap"
            ? "Wrap → confidential"
            : "Unwrap → public"}
      </button>

      <div className="mt-2 min-h-[1.25rem] text-xs">
        {!isConnected && <span className="text-white/45">Connect a wallet to wrap.</span>}
        {isConnected && !fheReady && <span className="text-mismatch">Wrap/unwrap is available on Sepolia.</span>}
        {onWrongChain && (
          <button onClick={() => switchChain({ chainId })} className="text-mismatch underline">
            Switch network to continue
          </button>
        )}
        {active.error && <span className="text-revoked">{(active.error as Error).message}</span>}
        {active.isSuccess && <span className="text-active">Done ✓ balance updates after decryption.</span>}
      </div>
    </div>
  );
}
