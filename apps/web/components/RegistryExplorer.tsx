"use client";

import { useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useRegistryPairs, type RegistryPair } from "@cwr/registry-sdk/react";
import { StatusBadge } from "./StatusBadge";
import { APP_CHAINS, explorerBase, type AppChainId } from "@/lib/chains";

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function RegistryExplorer() {
  const [chainId, setChainId] = useState<AppChainId>(sepolia.id);
  const [query, setQuery] = useState("");
  const client = usePublicClient({ chainId });

  const { data: pairs, isLoading, isError, error, refetch, isFetching } = useRegistryPairs({
    client,
    chainId,
  });

  const filtered = useMemo(() => {
    if (!pairs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter(
      (p) =>
        p.tokenSymbol?.toLowerCase().includes(q) ||
        p.wrapperSymbol?.toLowerCase().includes(q) ||
        p.token.toLowerCase().includes(q) ||
        p.wrapper.toLowerCase().includes(q),
    );
  }, [pairs, query]);

  const counts = useMemo(() => {
    const c = { active: 0, revoked: 0, "interface-mismatch": 0 };
    pairs?.forEach((p) => (c[p.status] += 1));
    return c;
  }, [pairs]);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registry Explorer</h1>
          <p className="mt-1 text-sm text-white/60">
            Every ERC-20 ↔ ERC-7984 wrapper pair in Zama&apos;s official registry, read live on-chain.
          </p>
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Network">
          {APP_CHAINS.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={chainId === c.id}
              onClick={() => setChainId(c.id)}
              className={`rounded-md px-3 py-1.5 text-sm ring-1 transition ${
                chainId === c.id
                  ? "bg-white/10 text-white ring-white/20"
                  : "text-white/60 ring-white/10 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol or address…"
          aria-label="Search pairs"
          className="w-64 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
        />
        {pairs && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="text-active">{counts.active} active</span>
            <span aria-hidden>·</span>
            <span className="text-revoked">{counts.revoked} revoked</span>
            <span aria-hidden>·</span>
            <span className="text-mismatch">{counts["interface-mismatch"]} mismatch</span>
          </div>
        )}
        <button
          onClick={() => refetch()}
          className="ml-auto rounded-md px-2.5 py-1 text-xs text-white/60 ring-1 ring-white/10 hover:text-white"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">Wrapper</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && <SkeletonRows />}
            {isError && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <p className="text-revoked">Failed to read the registry.</p>
                  <p className="mt-1 text-xs text-white/50">{(error as Error)?.message}</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 rounded-md px-3 py-1.5 text-xs ring-1 ring-white/20 hover:bg-white/5"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-white/50">
                  {query ? "No pairs match your search." : "No pairs on this network yet."}
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <PairRow key={p.wrapper} pair={p} chainId={chainId} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PairRow({ pair, chainId }: { pair: RegistryPair; chainId: number }) {
  const base = explorerBase(chainId);
  return (
    <tr className="transition hover:bg-white/[0.03]">
      <td className="px-4 py-3">
        <div className="font-medium">{pair.tokenSymbol ?? "—"}</div>
        <a
          href={`${base}/address/${pair.token}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-white/40 hover:text-white/70"
        >
          {short(pair.token)}
        </a>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{pair.wrapperSymbol ?? "—"}</div>
        <a
          href={`${base}/address/${pair.wrapper}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-white/40 hover:text-white/70"
        >
          {short(pair.wrapper)}
        </a>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={pair.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <a
          href={`/pair/${pair.wrapper}`}
          className="rounded-md px-2.5 py-1 text-xs text-white/70 ring-1 ring-white/10 hover:bg-white/5 hover:text-white"
        >
          Open
        </a>
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 4 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
