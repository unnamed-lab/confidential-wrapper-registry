"use client";

import { useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  useRegistryPairs,
  useRegistryEvents,
  detectAnomalies,
  type Anomaly,
} from "@cwr/registry-sdk/react";
import { ShieldAlert, Activity, FileText, CheckCircle2, XCircle, Terminal, ExternalLink } from "lucide-react";
import { APP_CHAINS, explorerBase, type AppChainId } from "@/lib/chains";

const SEV: Record<Anomaly["severity"], { cls: string; dot: string }> = {
  warning: { 
    cls: "text-mismatch border-mismatch/20 bg-mismatch/5 shadow-[0_0_12px_rgba(245,158,11,0.02)]",
    dot: "bg-mismatch" 
  },
  danger: { 
    cls: "text-revoked border-revoked/20 bg-revoked/5 shadow-[0_0_12px_rgba(239,68,68,0.02)]",
    dot: "bg-revoked animate-breathe-red" 
  },
};

function short(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function HealthDashboard() {
  const [chainId, setChainId] = useState<AppChainId>(sepolia.id);
  const client = usePublicClient({ chainId });
  const { data: pairs, isLoading } = useRegistryPairs({ client, chainId });
  const { data: events, isLoading: eventsLoading } = useRegistryEvents({ client, chainId });

  const anomalies = useMemo(() => detectAnomalies(pairs ?? []), [pairs]);
  const counts = useMemo(() => {
    const c = { active: 0, revoked: 0, "interface-mismatch": 0 };
    pairs?.forEach((p) => (c[p.status] += 1));
    return c;
  }, [pairs]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent cyber-text-glow">
            Registry Health
          </h1>
          <p className="mt-1 text-sm text-white/50 font-outfit">
            Live coverage monitoring, anomaly scanning, and on-chain event ledger logs.
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-space">
        <Stat 
          label="Total Pairs" 
          value={isLoading ? "…" : String(pairs?.length ?? 0)} 
          icon={<FileText className="w-4 h-4 text-brand" />}
          borderCls="hover:border-brand/35 hover:shadow-[0_0_15px_rgba(124,92,255,0.06)]"
        />
        <Stat 
          label="Active Wrappers" 
          value={String(counts.active)} 
          tone="text-active" 
          icon={<CheckCircle2 className="w-4 h-4 text-active" />}
          borderCls="hover:border-active/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.05)]"
        />
        <Stat 
          label="Revoked Pairs" 
          value={String(counts.revoked)} 
          tone="text-revoked" 
          icon={<XCircle className="w-4 h-4 text-revoked" />}
          borderCls="hover:border-revoked/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.05)]"
        />
        <Stat 
          label="Anomalies" 
          value={String(anomalies.length)} 
          tone="text-mismatch" 
          icon={<ShieldAlert className="w-4 h-4 text-mismatch" />}
          borderCls="hover:border-mismatch/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.05)]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 font-outfit">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <ShieldAlert className="w-4 h-4 text-mismatch" />
            <h2 className="text-sm font-semibold font-space uppercase tracking-wider text-white/70">Anomalies Detected</h2>
          </div>
          <div className="space-y-3">
            {!isLoading && anomalies.length === 0 && (
              <p className="rounded-xl border border-white/5 bg-[#0a0b14]/20 p-5 text-sm text-center text-white/40">
                No active anomalies or lookalikes identified on this network.
              </p>
            )}
            {anomalies.map((a, i) => {
              const sevStyles = SEV[a.severity];
              return (
                <div key={`${a.wrapper}-${a.kind}-${i}`} className={`rounded-xl border p-4 text-sm transition-all duration-300 ${sevStyles.cls}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${sevStyles.dot}`} />
                      <span className="font-semibold font-space tracking-wide uppercase text-xs">{a.kind}</span>
                    </div>
                    <a
                      href={`${explorerBase(chainId)}/address/${a.wrapper}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] opacity-75 hover:opacity-100 hover:text-white transition-all duration-200"
                    >
                      <span>{short(a.wrapper)}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-white/60 leading-relaxed font-outfit">{a.detail}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Activity className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold font-space uppercase tracking-wider text-white/70">Recent Ledger Activity</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#08090f]/50 backdrop-blur-xl shadow-2xl">
            <div className="bg-white/[0.01] px-4 py-2 border-b border-white/5 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Live chain feed stream</span>
            </div>
            <table className="w-full text-left text-sm border-collapse">
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {eventsLoading && (
                  <tr>
                    <td className="px-5 py-6 text-center text-white/45">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span>Scanning chain block history…</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!eventsLoading && (events?.length ?? 0) === 0 && (
                  <tr>
                    <td className="px-5 py-6 text-center text-white/40">
                      No registry event entries indexed in current epoch window.
                    </td>
                  </tr>
                )}
                {events?.slice(0, 25).map((e, i) => (
                  <tr key={`${e.txHash}-${i}`} className="hover:bg-white/[0.015] transition-colors duration-200">
                    <td className="px-5 py-3">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2.5 ${e.type === "revoked" ? "bg-revoked animate-breathe-red" : "bg-active"}`} />
                      <span className={`font-semibold font-space tracking-wide uppercase text-[10px] mr-2 ${e.type === "revoked" ? "text-revoked" : "text-active"}`}>{e.type}</span>{" "}
                      <span className="text-white/50">{short(e.wrapper)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`${explorerBase(chainId)}/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-brand hover:text-white transition-colors duration-200"
                      >
                        <span>Block #{e.blockNumber.toString()}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone, icon, borderCls }: { label: string; value: string; tone?: string; icon: React.ReactNode; borderCls?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 bg-[#0a0b14]/30 p-4 transition-all duration-300 flex items-start justify-between glass-panel shadow-md ${borderCls ?? "hover:border-white/10"}`}>
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40">{label}</div>
        <div className={`text-2xl font-bold font-space ${tone ?? "text-white"}`}>{value}</div>
      </div>
      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
        {icon}
      </div>
    </div>
  );
}
