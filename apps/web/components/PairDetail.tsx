"use client";

import { useState } from "react";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { usePair } from "@cwr/registry-sdk/react";
import { ArrowLeft, Coins, ShieldCheck, Code, ArrowLeftRight, Eye, ExternalLink } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { SnippetBlock } from "./SnippetBlock";
import { WrapPanel } from "./WrapPanel";
import { ConfidentialBalance } from "./ConfidentialBalance";
import { APP_CHAINS, explorerBase, type AppChainId } from "@/lib/chains";

export function PairDetail({ wrapper }: { wrapper: string }) {
  const [chainId, setChainId] = useState<AppChainId>(sepolia.id);
  const client = usePublicClient({ chainId });
  const { pair, isLoading, isError } = usePair({ client, chainId, address: wrapper });
  const base = explorerBase(chainId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold font-space tracking-wide uppercase text-white/50 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explorer</span>
        </Link>
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

      {isLoading && (
        <div className="h-44 animate-pulse rounded-xl bg-white/5 border border-white/5" />
      )}

      {!isLoading && (isError || !pair) && (
        <div className="rounded-xl border border-white/5 bg-[#0a0b14]/20 p-12 text-center text-white/50 max-w-lg mx-auto">
          <ShieldCheck className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="font-space font-semibold uppercase tracking-wider text-xs text-white/60">Registry Record Missing</p>
          <p className="mt-1.5 text-sm font-outfit text-white/40">This wrapper is not registered on {APP_CHAINS.find((c) => c.id === chainId)?.label}.</p>
          <p className="mt-1 text-xs font-outfit text-brand">Try switching network views.</p>
        </div>
      )}

      {pair && (
        <div className="space-y-6">
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold font-space tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent cyber-text-glow">
              {pair.tokenSymbol ?? "Token"} <span className="text-brand font-medium">→</span> {pair.wrapperSymbol ?? "Confidential"}
            </h1>
            <StatusBadge status={pair.status} />
          </header>

          <div className="grid gap-4 sm:grid-cols-2 font-outfit">
            <InfoCard
              title="Public Asset Token (ERC-20)"
              symbol={pair.tokenSymbol}
              name={pair.tokenName}
              address={pair.token}
              base={base}
              extra={pair.tokenDecimals !== undefined ? `${pair.tokenDecimals} decimals` : undefined}
              icon={<Coins className="w-4.5 h-4.5 text-brand" />}
            />
            <InfoCard
              title="Confidential Wrapper (ERC-7984)"
              symbol={pair.wrapperSymbol}
              address={pair.wrapper}
              base={base}
              extra={
                pair.supportsERC7984
                  ? "supportsInterface(0x4958f2a4) ✓"
                  : "interface verification pending"
              }
              icon={<ShieldCheck className="w-4.5 h-4.5 text-cyan-neon" />}
            />
          </div>

          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              <Code className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold font-space uppercase tracking-wider text-white/70">Developer Integration Tool</h2>
            </div>
            <p className="text-xs text-white/45 font-outfit px-1">
              Plug this pair into your dapp using wagmi, viem, or ethers, compiled with Zama&apos;s FHE SDK.
            </p>
            <SnippetBlock pair={pair} chainId={chainId} />
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1">
                <ArrowLeftRight className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold font-space uppercase tracking-wider text-white/70">Shielding Operations</h2>
              </div>
              <WrapPanel pair={pair} chainId={chainId} />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1">
                <Eye className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold font-space uppercase tracking-wider text-white/70">Confidential Ledger</h2>
              </div>
              <ConfidentialBalance pair={pair} chainId={chainId} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function InfoCard(props: {
  title: string;
  symbol?: string | undefined;
  name?: string | undefined;
  address: string;
  base: string;
  extra?: string | undefined;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0b14]/30 p-4.5 flex items-start justify-between glass-panel">
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold font-space uppercase tracking-wider text-white/40">{props.title}</div>
        <div className="text-lg font-bold text-white/90">
          {props.symbol ?? "—"}
          {props.name ? <span className="ml-2.5 text-sm font-normal text-white/45 font-outfit">{props.name}</span> : null}
        </div>
        <a
          href={`${props.base}/address/${props.address}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-white/35 hover:text-brand transition-colors duration-200 mt-1"
        >
          <span>{props.address}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
        {props.extra && <div className="text-xs text-brand/80 font-medium font-space tracking-wide uppercase pt-1">{props.extra}</div>}
      </div>
      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
        {props.icon}
      </div>
    </div>
  );
}
