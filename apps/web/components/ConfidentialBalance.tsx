"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  useConfidentialBalance,
  useGrantPermit,
  useHasPermit,
  useClearCredentials,
} from "@zama-fhe/react-sdk";
import { Fingerprint, Lock as LockIcon, Unlock, RefreshCw, AlertCircle } from "lucide-react";
import type { RegistryPair } from "@cwr/registry-sdk/react";
import type { AppChainId } from "@/lib/chains";

/**
 * Confidential balance reveal flow (EIP-712 user-decryption):
 *   locked → [grant permit: one signature, if needed] → decrypting → revealed.
 * The permit + cleartext are cached by the SDK; "Lock" clears both.
 */
export function ConfidentialBalance({ pair, chainId }: { pair: RegistryPair; chainId: AppChainId }) {
  const { address: account, isConnected } = useAccount();
  const [revealed, setRevealed] = useState(false);

  const fheReady = chainId === sepolia.id;
  const { data: hasPermit } = useHasPermit(
    { contractAddresses: [pair.wrapper] },
    { enabled: isConnected && fheReady },
  );
  const grant = useGrantPermit();
  const clear = useClearCredentials();
  const balance = useConfidentialBalance(
    { address: pair.wrapper, account },
    { enabled: revealed && isConnected && fheReady },
  );

  const decimals = pair.tokenDecimals ?? 18;

  async function reveal() {
    if (!hasPermit) {
      await grant.mutateAsync([pair.wrapper]); // one signature for this contract
    }
    setRevealed(true);
  }

  async function lock() {
    setRevealed(false);
    await clear.mutateAsync();
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0b14]/30 p-4.5 glass-panel shadow-lg font-outfit">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold font-space uppercase tracking-wider text-white/40">Confidential Balance Ledger</h3>
        {revealed && balance.isSuccess && (
          <button 
            onClick={lock} 
            className="flex items-center gap-1 text-[11px] font-semibold font-space tracking-wide uppercase text-white/50 hover:text-white transition-colors"
            title="Clear permit & decrypt credentials"
          >
            <Unlock className="w-3.5 h-3.5 text-brand" />
            <span>Lock</span>
          </button>
        )}
      </div>

      {!isConnected && (
        <p className="text-sm text-white/45 leading-relaxed">Connect wallet to decrypt cBalance ledger.</p>
      )}

      {isConnected && !fheReady && (
        <p className="text-sm text-mismatch flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          <span>FHE decryption is available on Sepolia.</span>
        </p>
      )}

      {isConnected && fheReady && (
        <>
          {!revealed && (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05060b]/60 border border-white/5 text-sm text-white/35 shadow-inner" aria-hidden>
                <LockIcon className="w-3.5 h-3.5 text-brand" />
                <span className="tracking-widest">••••••</span>
              </span>
              <button
                onClick={reveal}
                disabled={grant.isPending}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-500 hover:shadow-[0_0_12px_rgba(124,92,255,0.3)] shadow-lg shadow-brand/10 border border-brand/30 hover:border-brand/50 px-4 py-2 text-xs font-semibold font-space tracking-wide uppercase text-white transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
              >
                <Fingerprint className={`w-3.5 h-3.5 ${grant.isPending ? "animate-pulse text-cyan-neon" : ""}`} />
                <span>
                  {grant.isPending
                    ? "Confirming…"
                    : hasPermit
                      ? "Reveal Balance"
                      : "Reveal (1 signature)"}
                </span>
              </button>
            </div>
          )}

          {revealed && balance.isLoading && (
            <div className="flex items-center gap-2.5 text-xs font-semibold font-space tracking-wide uppercase text-white/60">
              <RefreshCw className="w-4 h-4 animate-spin text-brand" />
              <span>Decrypting ledger…</span>
            </div>
          )}

          {revealed && balance.isSuccess && balance.data !== undefined && (
            <div className="font-mono text-2xl text-white font-bold">
              {formatUnits(balance.data, decimals)}{" "}
              <span className="text-sm text-brand font-medium tracking-wide uppercase font-space ml-1">{pair.wrapperSymbol ?? "c" + (pair.tokenSymbol ?? "")}</span>
            </div>
          )}

          {(grant.error || balance.error) && (
            <p className="mt-2 text-xs text-revoked">{(grant.error ?? balance.error)?.message}</p>
          )}
        </>
      )}
    </div>
  );
}
