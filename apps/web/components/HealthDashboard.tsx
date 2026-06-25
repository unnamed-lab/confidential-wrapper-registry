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
import { APP_CHAINS, explorerBase, type AppChainId } from "@/lib/chains";

const SEV: Record<Anomaly["severity"], string> = {
  warning: "text-mismatch ring-mismatch/30 bg-mismatch-soft",
  danger: "text-revoked ring-revoked/30 bg-revoked-soft",
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
    <section>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registry Health</h1>
          <p className="mt-1 text-sm text-white/60">
            Live coverage, anomaly detection, and recent on-chain registry activity.
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Network">
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

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total pairs" value={isLoading ? "…" : String(pairs?.length ?? 0)} />
        <Stat label="Active" value={String(counts.active)} tone="text-active" />
        <Stat label="Revoked" value={String(counts.revoked)} tone="text-revoked" />
        <Stat label="Anomalies" value={String(anomalies.length)} tone="text-mismatch" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-white/70">Anomalies</h2>
          <div className="space-y-2">
            {!isLoading && anomalies.length === 0 && (
              <p className="rounded-lg border border-white/10 p-4 text-sm text-white/50">
                No anomalies detected on this network.
              </p>
            )}
            {anomalies.map((a, i) => (
              <div key={`${a.wrapper}-${a.kind}-${i}`} className={`rounded-lg p-3 text-sm ring-1 ${SEV[a.severity]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.kind}</span>
                  <a
                    href={`${explorerBase(chainId)}/address/${a.wrapper}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs opacity-70 hover:opacity-100"
                  >
                    {short(a.wrapper)}
                  </a>
                </div>
                <p className="mt-1 text-xs opacity-80">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-white/70">Recent activity</h2>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-white/5">
                {eventsLoading && (
                  <tr>
                    <td className="px-4 py-4 text-white/50">Scanning recent blocks…</td>
                  </tr>
                )}
                {!eventsLoading && (events?.length ?? 0) === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-white/50">No registry events in the recent window.</td>
                  </tr>
                )}
                {events?.slice(0, 25).map((e, i) => (
                  <tr key={`${e.txHash}-${i}`} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5">
                      <span className={e.type === "revoked" ? "text-revoked" : "text-active"}>{e.type}</span>{" "}
                      <span className="text-white/60">{short(e.wrapper)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a
                        href={`${explorerBase(chainId)}/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-white/45 hover:text-white/75"
                      >
                        #{e.blockNumber.toString()}
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs uppercase tracking-wide text-white/40">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
