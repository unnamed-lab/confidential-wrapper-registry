"use client";

import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useRegistryPairs, type RegistryPair } from "@cwr/registry-sdk/react";
import { useConfidentialBalances, useGrantPermit, useClearCredentials } from "@zama-fhe/react-sdk";
import { AlertCircle, Fingerprint, Lock as LockIcon, Unlock, ExternalLink, RefreshCw } from "lucide-react";
import { APP_CHAINS, explorerBase, type AppChainId } from "@/lib/chains";

function short(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Confidential portfolio — the headline feature: decrypt every registry balance the
 * connected wallet holds with a SINGLE EIP-712 signature.
 *   grantPermit([...all wrappers])  →  useConfidentialBalances({ addresses, account })
 */
export function PortfolioView() {
  const [chainId, setChainId] = useState<AppChainId>(sepolia.id);
  const [revealed, setRevealed] = useState(false);
  const { address: account, isConnected } = useAccount();
  const client = usePublicClient({ chainId });

  const fheReady = chainId === sepolia.id;
  const { data: pairs, isLoading: pairsLoading } = useRegistryPairs({ client, chainId });

  const activePairs = useMemo(() => (pairs ?? []).filter((p) => p.status === "active"), [pairs]);
  const wrappers = useMemo(() => activePairs.map((p) => p.wrapper), [activePairs]);

  const grant = useGrantPermit();
  const clear = useClearCredentials();
  const balances = useConfidentialBalances(
    { addresses: revealed ? wrappers : [], account },
    { enabled: revealed && isConnected && fheReady },
  );

  async function decryptAll() {
    if (wrappers.length === 0) return;
    await grant.mutateAsync(wrappers); // ONE signature covering every wrapper
    setRevealed(true);
  }

  async function lock() {
    setRevealed(false);
    await clear.mutateAsync();
  }

  const result = balances.data;
  const decryptedCount = result ? result.results.size : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent cyber-text-glow">
            Confidential Portfolio
          </h1>
          <p className="mt-1 text-sm text-white/50 font-outfit">
            Decrypt every confidential balance you hold across the registry — with one signature.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/[0.02] p-1 rounded-lg border border-white/5" role="tablist" aria-label="Network">
          {APP_CHAINS.map((c) => {
            const isSel = chainId === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={isSel}
                onClick={() => {
                  setChainId(c.id);
                  setRevealed(false);
                }}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold font-space tracking-wide uppercase transition-all duration-300 ${
                  isSel
                    ? "bg-brand text-white shadow-[0_0_15px_rgba(124,92,255,0.35)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {!isConnected && (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-white/5 bg-[#0a0b14]/20 backdrop-blur-md text-center text-white/40">
          <LockIcon className="w-10 h-10 text-white/20 mb-3" />
          <p className="font-space font-semibold uppercase tracking-wider text-xs text-white/50 mb-1">Vault Locked</p>
          <p className="text-sm max-w-xs font-outfit">Please connect your wallet to access your confidential balances.</p>
        </div>
      )}

      {isConnected && !fheReady && (
        <div className="flex items-center gap-3 p-5 rounded-xl border border-mismatch/20 bg-mismatch/5 text-mismatch">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-outfit">
            Fully Homomorphic Encryption (FHE) decryption is currently supported on <span className="font-semibold text-white">Sepolia</span>.
          </p>
        </div>
      )}

      {isConnected && fheReady && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {!revealed ? (
              <button
                onClick={decryptAll}
                disabled={grant.isPending || pairsLoading || wrappers.length === 0}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-500 hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] shadow-lg shadow-brand/10 border border-brand/35 hover:border-brand/50 px-5 py-2.5 text-xs font-semibold font-space tracking-wide uppercase text-white transition-all duration-300 disabled:opacity-40 disabled:shadow-none"
              >
                <Fingerprint className={`w-4 h-4 ${grant.isPending ? "animate-pulse text-cyan-neon" : ""}`} />
                <span>
                  {grant.isPending
                    ? "Confirm permit signature in wallet…"
                    : `Decrypt Portfolio (1 Signature) · ${wrappers.length} tokens`}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl shadow-inner">
                {balances.isLoading ? (
                  <div className="flex items-center gap-2 text-xs font-semibold font-space tracking-wide uppercase text-white/60">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                    <span>Decrypting balances…</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold font-space tracking-wide uppercase text-active cyber-text-glow">
                    {decryptedCount} / {wrappers.length} balances decrypted with 1 signature
                  </span>
                )}
                <div className="w-px h-4 bg-white/10" />
                <button
                  onClick={lock}
                  className="flex items-center gap-1 text-xs font-semibold font-space tracking-wide uppercase text-white/60 hover:text-white transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5 text-brand" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0a0b14]/30 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] font-semibold font-space uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-5 py-3.5">Token (Asset class)</th>
                    <th className="px-5 py-3.5">Wrapper Address</th>
                    <th className="px-5 py-3.5 text-right">Confidential Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-outfit">
                  {(pairsLoading ? [] : activePairs).map((p) => (
                    <PortfolioRow
                      key={p.wrapper}
                      pair={p}
                      chainId={chainId}
                      revealed={revealed}
                      decrypting={balances.isLoading}
                      value={result?.results.get(p.wrapper)}
                      failed={result?.errors.has(p.wrapper) ?? false}
                    />
                  ))}
                  {!pairsLoading && activePairs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-white/40">
                        No active wrapper pairs on this network.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function PortfolioRow(props: {
  pair: RegistryPair;
  chainId: number;
  revealed: boolean;
  decrypting: boolean;
  value: bigint | undefined;
  failed: boolean;
}) {
  const { pair, chainId, revealed, decrypting, value, failed } = props;
  const decimals = pair.tokenDecimals ?? 18;
  return (
    <tr className="hover:bg-white/[0.015] transition-colors duration-200">
      <td className="px-5 py-4">
        <div className="font-semibold text-white/90">{pair.tokenSymbol ?? "—"}</div>
        <div className="text-[10px] text-brand uppercase font-space font-semibold tracking-wider mt-0.5">Confidential Asset</div>
      </td>
      <td className="px-5 py-4">
        <a
          href={`${explorerBase(chainId)}/address/${pair.wrapper}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-white/35 hover:text-brand transition-colors duration-200"
        >
          <span>{short(pair.wrapper)}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
      </td>
      <td className="px-5 py-4 text-right font-mono">
        {!revealed && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b0d16] border border-white/5 text-[11px] text-white/35 shadow-inner">
            <LockIcon className="w-3 h-3 text-brand" />
            <span className="tracking-widest">••••</span>
          </span>
        )}
        {revealed && decrypting && (
          <span className="inline-block h-5 w-24 animate-pulse rounded bg-white/5" />
        )}
        {revealed && !decrypting && value !== undefined && (
          <span className="text-white font-semibold text-base">
            {formatUnits(value, decimals)}{" "}
            <span className="text-xs text-brand font-medium tracking-wide uppercase font-space ml-1">{pair.wrapperSymbol}</span>
          </span>
        )}
        {revealed && !decrypting && value === undefined && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold font-space tracking-wide uppercase text-revoked bg-revoked/5 border border-revoked/20 px-2 py-0.5 rounded">
            {failed ? "decrypt failed" : "—"}
          </span>
        )}
      </td>
    </tr>
  );
}
