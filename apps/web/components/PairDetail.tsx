"use client";

import { useState } from "react";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { usePair } from "@cwr/registry-sdk/react";
import { StatusBadge } from "./StatusBadge";
import { SnippetBlock } from "./SnippetBlock";
import { WrapPanel } from "./WrapPanel";
import { APP_CHAINS, explorerBase, type AppChainId } from "@/lib/chains";

export function PairDetail({ wrapper }: { wrapper: string }) {
  const [chainId, setChainId] = useState<AppChainId>(sepolia.id);
  const client = usePublicClient({ chainId });
  const { pair, isLoading, isError } = usePair({ client, chainId, address: wrapper });
  const base = explorerBase(chainId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Explorer
        </Link>
        <div className="flex items-center gap-2" role="tablist" aria-label="Network">
          {APP_CHAINS.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={chainId === c.id}
              onClick={() => setChainId(c.id)}
              className={`rounded-md px-3 py-1.5 text-sm ring-1 transition ${
                chainId === c.id ? "bg-white/10 text-white ring-white/20" : "text-white/60 ring-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-white/5" />}

      {!isLoading && (isError || !pair) && (
        <div className="rounded-xl border border-white/10 p-10 text-center text-white/60">
          <p>This wrapper isn&apos;t in the registry on {APP_CHAINS.find((c) => c.id === chainId)?.label}.</p>
          <p className="mt-1 text-xs text-white/40">Try switching networks.</p>
        </div>
      )}

      {pair && (
        <div className="space-y-6">
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {pair.tokenSymbol ?? "Token"} → {pair.wrapperSymbol ?? "Confidential"}
            </h1>
            <StatusBadge status={pair.status} />
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              title="Public token (ERC-20)"
              symbol={pair.tokenSymbol}
              name={pair.tokenName}
              address={pair.token}
              base={base}
              extra={pair.tokenDecimals !== undefined ? `${pair.tokenDecimals} decimals` : undefined}
            />
            <InfoCard
              title="Confidential wrapper (ERC-7984)"
              symbol={pair.wrapperSymbol}
              address={pair.wrapper}
              base={base}
              extra={
                pair.supportsERC7984
                  ? "supportsInterface(0x4958f2a4) ✓"
                  : "interface not detected"
              }
            />
          </div>

          <section>
            <h2 className="mb-2 text-sm font-medium text-white/70">Integrate this pair</h2>
            <p className="mb-3 text-xs text-white/45">
              Copy-paste, chain-correct code that wraps {pair.tokenSymbol ?? "this token"} via the Zama v3 SDK.
            </p>
            <SnippetBlock pair={pair} chainId={chainId} />
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 text-sm font-medium text-white/70">Wrap / unwrap</h2>
              <WrapPanel pair={pair} chainId={chainId} />
            </div>
            <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/45">
              Confidential balance + decryption lands on Day 5.
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
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs uppercase tracking-wide text-white/40">{props.title}</div>
      <div className="mt-1 text-lg font-medium">
        {props.symbol ?? "—"}
        {props.name ? <span className="ml-2 text-sm text-white/50">{props.name}</span> : null}
      </div>
      <a
        href={`${props.base}/address/${props.address}`}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block break-all font-mono text-xs text-white/45 hover:text-white/75"
      >
        {props.address}
      </a>
      {props.extra && <div className="mt-2 text-xs text-white/55">{props.extra}</div>}
    </div>
  );
}
