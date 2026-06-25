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
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Your confidential balance</h3>
        {revealed && balance.isSuccess && (
          <button onClick={lock} className="text-xs text-white/50 hover:text-white" title="Clear permit + cleartext">
            🔓 Lock
          </button>
        )}
      </div>

      {!isConnected && <p className="text-sm text-white/45">Connect a wallet to view your balance.</p>}

      {isConnected && !fheReady && (
        <p className="text-sm text-mismatch">Decryption is available on Sepolia.</p>
      )}

      {isConnected && fheReady && (
        <>
          {!revealed && (
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-2xl tracking-widest text-white/40" aria-hidden>
                🔒 ••••••
              </span>
              <button
                onClick={reveal}
                disabled={grant.isPending}
                className="rounded-md bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50"
              >
                {grant.isPending
                  ? "Confirm in wallet…"
                  : hasPermit
                    ? "Reveal balance"
                    : "Reveal balance (1 signature)"}
              </button>
            </div>
          )}

          {revealed && balance.isLoading && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span className="h-4 w-28 animate-pulse rounded bg-white/10" /> Decrypting…
            </div>
          )}

          {revealed && balance.isSuccess && balance.data !== undefined && (
            <div className="font-mono text-2xl">
              {formatUnits(balance.data, decimals)}{" "}
              <span className="text-sm text-white/50">{pair.wrapperSymbol ?? "c" + (pair.tokenSymbol ?? "")}</span>
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
