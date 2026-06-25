"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useShield, useUnshield } from "@zama-fhe/react-sdk";
import { Check, AlertCircle } from "lucide-react";
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
    <div className="rounded-xl border border-white/5 bg-[#0a0b14]/30 p-4.5 glass-panel shadow-lg font-outfit">
      <div className="mb-4 flex gap-2 bg-[#05060b]/60 p-1 rounded-lg border border-white/5">
        {(["wrap", "unwrap"] as Mode[]).map((m) => {
          const isSel = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={isSel}
              className={`flex-1 rounded-md py-2 text-xs font-semibold font-space tracking-wide uppercase transition-all duration-300 ${
                isSel 
                  ? "bg-brand/10 border border-brand/25 text-brand shadow-[0_0_10px_rgba(124,92,255,0.1)]" 
                  : "text-white/45 hover:text-white/80 hover:bg-white/[0.02]"
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold font-space uppercase tracking-wider text-white/40" htmlFor="wrap-amount">
          Amount ({mode === "wrap" ? (pair.tokenSymbol ?? "token") : (pair.wrapperSymbol ?? "confidential")})
        </label>
        <input
          id="wrap-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-white/10 bg-[#08090f]/60 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-brand/40 focus:bg-[#08090f]/90 focus:shadow-[0_0_15px_rgba(124,92,255,0.15)] transition-all duration-300 font-mono"
        />
      </div>

      <button
        onClick={submit}
        disabled={disabled}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-500 hover:shadow-[0_0_15px_rgba(124,92,255,0.35)] shadow-lg shadow-brand/10 border border-brand/30 hover:border-brand/50 px-4 py-2.5 text-xs font-semibold font-space tracking-wide uppercase text-white transition-all duration-300 disabled:opacity-40 disabled:shadow-none"
      >
        {active.isPending
          ? mode === "wrap"
            ? "Shielding Assets…"
            : "Unshielding Assets…"
          : mode === "wrap"
            ? "Wrap → Shield Confidential"
            : "Unwrap → Public Asset"}
      </button>

      <div className="mt-3.5 min-h-[1.5rem] flex items-center gap-1.5 text-xs px-0.5">
        {!isConnected && <span className="text-white/45">Connect wallet to transact.</span>}
        {isConnected && !fheReady && (
          <span className="flex items-center gap-1 text-mismatch">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Wrap operations only available on Sepolia.</span>
          </span>
        )}
        {onWrongChain && (
          <button 
            onClick={() => switchChain({ chainId })} 
            className="flex items-center gap-1 text-mismatch hover:text-white underline font-semibold transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Switch network to continue</span>
          </button>
        )}
        {active.error && <span className="text-revoked">{(active.error as Error).message}</span>}
        {active.isSuccess && (
          <span className="flex items-center gap-1 text-active font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Done! Decrypt to see new balance.</span>
          </span>
        )}
      </div>
    </div>
  );
}
