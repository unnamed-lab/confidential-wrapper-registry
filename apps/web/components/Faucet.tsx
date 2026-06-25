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
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sepolia Faucet</h1>
        <p className="mt-1 text-sm text-white/60">
          Mint the official cTokenMock ERC-20s, then wrap them into confidential tokens.
        </p>
      </div>

      {isConnected && walletChainId !== sepolia.id && (
        <div className="mb-4 rounded-md bg-mismatch-soft px-4 py-2 text-sm text-mismatch">
          The faucet runs on Sepolia.{" "}
          <button onClick={() => switchChain({ chainId: sepolia.id })} className="underline">
            Switch network
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 text-right font-medium">Your balance</th>
              <th className="px-4 py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-white/50">
                  Loading tokens…
                </td>
              </tr>
            )}
            {faucetPairs.map((p) => (
              <FaucetRow key={p.token} pair={p} disabled={!isConnected || walletChainId !== sepolia.id} />
            ))}
          </tbody>
        </table>
      </div>
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
    <tr className="hover:bg-white/[0.03]">
      <td className="px-4 py-3 font-medium">{pair.tokenSymbol ?? "—"}</td>
      <td className="px-4 py-3 text-right font-mono">
        {balance !== undefined ? formatUnits(balance, decimals) : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/pair/${pair.wrapper}`}
            className="rounded-md px-2.5 py-1 text-xs text-white/70 ring-1 ring-white/10 hover:bg-white/5 hover:text-white"
          >
            Wrap →
          </Link>
          <button
            onClick={drip}
            disabled={disabled || isPending || remaining > 0}
            className="rounded-md bg-[#7c5cff] px-3 py-1 text-xs font-medium text-white hover:bg-[#6b4ce0] disabled:opacity-40"
          >
            {isPending ? "Dripping…" : remaining > 0 ? `Wait ${remaining}s` : `Drip ${DRIP}`}
          </button>
        </div>
      </td>
    </tr>
  );
}
