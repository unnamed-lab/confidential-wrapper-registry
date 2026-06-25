"use client";

import { useMemo, useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useRegistryPairs, type RegistryPair } from "@cwr/registry-sdk/react";
import { Search, RefreshCw, ExternalLink, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { APP_CHAINS, explorerBase, type AppChainId } from "@/lib/chains";

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function RegistryExplorer() {
  const [chainId, setChainId] = useState<AppChainId>(sepolia.id);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // duplicate chainId state removed
  // duplicate query state removed
  const client = usePublicClient({ chainId });

  // Reset query when network changes
  useEffect(() => {
    setQuery("");
    setDebouncedQuery("");
  }, [chainId]);

  // Debounce query input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: pairs, isLoading, isError, error, refetch, isFetching } = useRegistryPairs({
    client,
    chainId,
  });

  const filtered = useMemo(() => {
    if (!pairs) return [];
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter(
      (p) =>
        p.tokenSymbol?.toLowerCase().includes(q) ||
        p.wrapperSymbol?.toLowerCase().includes(q) ||
        p.token.toLowerCase().includes(q) ||
        p.wrapper.toLowerCase().includes(q),
    );
  }, [pairs, debouncedQuery]);

  const counts = useMemo(() => {
    const c = { active: 0, revoked: 0, "interface-mismatch": 0 };
    pairs?.forEach((p) => (c[p.status] += 1));
    return c;
  }, [pairs]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent cyber-text-glow">
            Registry Explorer
          </h1>
          <p className="mt-1 text-sm text-white/50 font-outfit">
            Every ERC-20 ↔ ERC-7984 wrapper pair in Zama&apos;s official registry, read live on-chain.
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
                onClick={() => setChainId(c.id)}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol or address…"
            aria-label="Search pairs"
            className="w-full rounded-lg border border-white/10 bg-[#08090f]/60 pl-10 pr-4 py-2 text-sm outline-none placeholder:text-white/35 focus:border-brand/40 focus:bg-[#08090f]/90 focus:shadow-[0_0_15px_rgba(124,92,255,0.15)] transition-all duration-300"
          />
        </div>
        
        {pairs && (
          <div className="flex items-center gap-2 text-[11px] font-space font-semibold uppercase tracking-wider bg-white/[0.02] border border-white/5 px-3 py-2 rounded-lg">
            <span className="text-active cyber-text-glow">{counts.active} active</span>
            <span className="text-white/20" aria-hidden>|</span>
            <span className="text-revoked">{counts.revoked} revoked</span>
            <span className="text-white/20" aria-hidden>|</span>
            <span className="text-mismatch">{counts["interface-mismatch"]} mismatch</span>
          </div>
        )}
        
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="sm:ml-auto flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold font-space tracking-wide uppercase text-white/70 border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-brand" : ""}`} />
          <span>{isFetching ? "Refreshing…" : "Refresh"}</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0a0b14]/30 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] font-semibold font-space uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3.5">Token (ERC-20)</th>
                <th className="px-5 py-3.5">Wrapper (ERC-7984)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-outfit">
              {isLoading && <SkeletonRows />}
              {isError && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <p className="text-revoked font-semibold">Failed to read the registry.</p>
                    <p className="mt-1 text-xs text-white/40">{(error as Error)?.message}</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold font-space tracking-wide uppercase border border-white/10 hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition-all duration-300"
                    >
                      Retry Connection
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-white/40">
                    {query ? "No pairs match your search query." : "No wrapper pairs configured on this network."}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <PairRow key={p.wrapper} pair={p} chainId={chainId} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PairRow({ pair, chainId }: { pair: RegistryPair; chainId: number }) {
  const base = explorerBase(chainId);
  return (
    <tr className="transition hover:bg-white/[0.015]">
      <td className="px-5 py-4">
        <div className="font-semibold text-white/90">{pair.tokenSymbol ?? "—"}</div>
        <a
          href={`${base}/address/${pair.token}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 mt-0.5 font-mono text-[11px] text-white/35 hover:text-brand transition-colors duration-200"
        >
          <span>{short(pair.token)}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold text-white/90">{pair.wrapperSymbol ?? "—"}</div>
        <a
          href={`${base}/address/${pair.wrapper}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 mt-0.5 font-mono text-[11px] text-white/35 hover:text-brand transition-colors duration-200"
        >
          <span>{short(pair.wrapper)}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={pair.status} />
      </td>
      <td className="px-5 py-4 text-right">
        <a
          href={`/pair/${pair.wrapper}`}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold font-space tracking-wide uppercase text-brand bg-brand/10 border border-brand/20 hover:bg-brand hover:text-white hover:shadow-[0_0_12px_rgba(124,92,255,0.45)] transition-all duration-300"
        >
          <span>Open</span>
          <ChevronRight className="w-3.5 h-3.5" />
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
            <td key={j} className="px-5 py-5">
              <div className="h-4.5 w-24 animate-pulse rounded bg-white/5" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
