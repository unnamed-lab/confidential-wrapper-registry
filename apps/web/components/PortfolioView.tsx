"use client";

import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useRegistryPairs, type RegistryPair } from "@cwr/registry-sdk/react";
import { useConfidentialBalances, useGrantPermit, useClearCredentials } from "@zama-fhe/react-sdk";
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
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Confidential Portfolio</h1>
          <p className="mt-1 text-sm text-white/60">
            Decrypt every confidential balance you hold across the registry — with one signature.
          </p>
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Network">
          {APP_CHAINS.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={chainId === c.id}
              onClick={() => {
                setChainId(c.id);
                setRevealed(false);
              }}
              className={`rounded-md px-3 py-1.5 text-sm ring-1 transition ${
                chainId === c.id ? "bg-white/10 text-white ring-white/20" : "text-white/60 ring-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {!isConnected && (
        <div className="rounded-xl border border-white/10 p-10 text-center text-white/55">
          Connect a wallet to view your confidential portfolio.
        </div>
      )}

      {isConnected && !fheReady && (
        <div className="rounded-xl border border-white/10 p-10 text-center text-mismatch">
          Portfolio decryption is available on Sepolia.
        </div>
      )}

      {isConnected && fheReady && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {!revealed ? (
              <button
                onClick={decryptAll}
                disabled={grant.isPending || pairsLoading || wrappers.length === 0}
                className="rounded-md bg-[#7c5cff] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b4ce0] disabled:opacity-40"
              >
                {grant.isPending
                  ? "Confirm in wallet…"
                  : `Decrypt entire portfolio (1 signature) · ${wrappers.length} tokens`}
              </button>
            ) : (
              <>
                <span className="text-sm text-white/70">
                  {balances.isLoading
                    ? "Decrypting your portfolio…"
                    : `${decryptedCount} / ${wrappers.length} balances decrypted with 1 signature`}
                </span>
                <button
                  onClick={lock}
                  className="rounded-md px-3 py-1.5 text-xs text-white/60 ring-1 ring-white/10 hover:text-white"
                >
                  🔓 Lock
                </button>
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Wrapper</th>
                  <th className="px-4 py-3 text-right font-medium">Confidential balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                    <td colSpan={3} className="px-4 py-10 text-center text-white/50">
                      No active pairs on this network.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
    <tr className="hover:bg-white/[0.03]">
      <td className="px-4 py-3 font-medium">{pair.tokenSymbol ?? "—"}</td>
      <td className="px-4 py-3">
        <a
          href={`${explorerBase(chainId)}/address/${pair.wrapper}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-white/45 hover:text-white/75"
        >
          {short(pair.wrapper)}
        </a>
      </td>
      <td className="px-4 py-3 text-right font-mono">
        {!revealed && <span className="text-white/40">🔒 ••••</span>}
        {revealed && decrypting && <span className="inline-block h-4 w-16 animate-pulse rounded bg-white/10" />}
        {revealed && !decrypting && value !== undefined && (
          <span>
            {formatUnits(value, decimals)}{" "}
            <span className="text-xs text-white/45">{pair.wrapperSymbol}</span>
          </span>
        )}
        {revealed && !decrypting && value === undefined && (
          <span className="text-xs text-revoked">{failed ? "decrypt failed" : "—"}</span>
        )}
      </td>
    </tr>
  );
}
