"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Lightweight wallet connect (replaces RainbowKit; wagmi v3). */
export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => disconnect()}
          title="Disconnect Wallet"
          className="flex items-center gap-2 rounded-lg bg-brand/10 border border-brand/20 hover:border-brand/40 px-3.5 py-1.5 font-mono text-sm text-brand shadow-[0_0_15px_rgba(124,92,255,0.05)] transition-all duration-300 hover:bg-brand/20 hover:shadow-[0_0_15px_rgba(124,92,255,0.15)]"
        >
          <Wallet className="w-4 h-4 text-cyan-neon" />
          <span>{short(address)}</span>
          <LogOut className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-500 px-4 py-2 text-xs font-semibold font-space tracking-wide uppercase text-white shadow-lg shadow-brand/10 border border-brand/30 hover:border-brand/50 hover:shadow-[0_0_20px_rgba(124,92,255,0.3)] transition-all duration-300 disabled:opacity-50"
      >
        <Wallet className="w-3.5 h-3.5" />
        <span>{isPending ? "Connecting…" : "Connect Wallet"}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-white/15 bg-[#0a0b14]/90 backdrop-blur-xl shadow-2xl"
          role="menu"
        >
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
            <p className="text-[10px] uppercase tracking-wider font-space text-white/40">Select Wallet Provider</p>
          </div>
          <div className="p-1">
            {connectors.length === 0 && (
              <p className="px-3 py-4 text-xs text-white/50 text-center">
                No wallet detected. Install MetaMask or another browser wallet.
              </p>
            )}
            {connectors.map((c) => (
              <button
                key={c.uid}
                role="menuitem"
                onClick={() => {
                  connect({ connector: c });
                  setOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-lg text-left text-sm text-white/80 hover:bg-brand/10 hover:text-white hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-200"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand mr-2.5 shadow-[0_0_8px_#7c5cff]" />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
