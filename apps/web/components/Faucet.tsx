"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { useRegistryPairs, type RegistryPair } from "@cwr/registry-sdk/react";
import { getChainAddresses } from "@cwr/registry-sdk";
import { AlertCircle, ArrowUpRight, Droplet } from "lucide-react";
import { mintableErc20Abi } from "@/lib/abis";

const DRIP = "1000"; // human units
const COOLDOWN_MS = 30_000;

export function Faucet() {
  const client = usePublicClient({ chainId: sepolia.id });
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { data: pairs, isLoading } = useRegistryPairs({ client, chainId: sepolia.id });
  const mocks = new Set(getChainAddresses(sepolia.id).cTokenMocks.map((a) => a.toLowerCase()));
  const faucetPairs = (pairs ?? []).filter((p) => mocks.has(p.token.toLowerCase()));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-space tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent cyber-text-glow">
          Sepolia Faucet
        </h1>
        <p className="mt-1 text-sm text-white/50 font-outfit">
          Mint official cTokenMock ERC-20s, then wrap them into homomorphic confidential tokens.
        </p>
      </div>

      {isConnected && walletChainId !== sepolia.id && (
        <div className="flex items-center gap-2.5 rounded-lg bg-mismatch/5 border border-mismatch/25 p-4 text-sm text-mismatch">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="font-outfit">
            The faucet operates exclusively on Sepolia.{" "}
            <button onClick={() => switchChain({ chainId: sepolia.id })} className="underline font-semibold hover:text-white transition-colors">
              Switch Network
            </button>
          </div>
        </div>
      )}

<div className="overflow-hidden rounded-xl border border-white/5 bg-[#0a0b14]/30 backdrop-blur-xl shadow-2xl">
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] font-semibold font-space uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-5 py-3.5">Token (ERC-20 Mock)</th>
              <th className="px-5 py-3.5 text-right">Your Balance</th>
              <th className="px-5 py-3.5 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-outfit">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <span>Loading faucet assets…</span>
                  </div>
                </td>
              </tr>
            )}
            {faucetPairs.map((p) => (
              <FaucetRow key={p.token} pair={p} disabled={!isConnected || walletChainId !== sepolia.id} />
            ))}
          </tbody>
        </table>
</div></div>
    </section>
  );
}

function FaucetRow({ pair, disabled }: { pair: RegistryPair; disabled: boolean }) {
  const { address: account } = useAccount();
  const client = usePublicClient({ chainId: sepolia.id });
  const decimals = pair.tokenDecimals ?? 18;
  const key = `cwr:faucet:${pair.token.toLowerCase()}`;

  const { data: balance, refetch } = useReadContract({
    address: pair.token,
    abi: mintableErc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(account) },
  });

  const { writeContractAsync, isPending } = useWriteContract();
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const stored = Number(localStorage.getItem(key) ?? 0);
    if (stored > Date.now()) setCooldownEnd(stored);
  }, [key]);

  useEffect(() => {
    if (cooldownEnd <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cooldownEnd]);

  const remaining = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));

  async function drip() {
    if (!account || !client) return;
    const hash = await writeContractAsync({
      address: pair.token,
      abi: mintableErc20Abi,
      functionName: "mint",
      args: [account, parseUnits(DRIP, decimals)],
    });
    await client.waitForTransactionReceipt({ hash });
    const end = Date.now() + COOLDOWN_MS;
    localStorage.setItem(key, String(end));
    setCooldownEnd(end);
    setNow(Date.now());
    refetch();
  }

  return (
    <tr className="hover:bg-white/[0.015] transition-colors duration-200">
      <td className="px-5 py-4 font-semibold text-white/90">{pair.tokenSymbol ?? "—"}</td>
      <td className="px-5 py-4 text-right font-mono text-white/80">
        {balance !== undefined ? formatUnits(balance, decimals) : "—"}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2.5">
          <Link
            href={`/pair/${pair.wrapper}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold font-space tracking-wide uppercase text-white/70 border border-white/10 hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition-all duration-300"
          >
            <span>Wrap</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={drip}
            disabled={disabled || isPending || remaining > 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-500 hover:shadow-[0_0_12px_rgba(124,92,255,0.35)] shadow-lg shadow-brand/10 border border-brand/30 hover:border-brand/50 px-4 py-1.5 text-xs font-semibold font-space tracking-wide uppercase text-white transition-all duration-300 disabled:opacity-40 disabled:shadow-none disabled:border-white/10"
          >
            <Droplet className={`w-3.5 h-3.5 ${isPending ? "animate-pulse" : ""}`} />
            <span>{isPending ? "Dripping…" : remaining > 0 ? `Wait ${remaining}s` : `Drip ${DRIP}`}</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
