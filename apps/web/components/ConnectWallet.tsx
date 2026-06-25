"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

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
      <button
        onClick={() => disconnect()}
        title="Disconnect"
        className="rounded-md bg-white/10 px-3 py-1.5 font-mono text-sm text-white ring-1 ring-white/15 hover:bg-white/15"
      >
        {short(address)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="rounded-md bg-[#7c5cff] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6b4ce0] disabled:opacity-50"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-[#11141b] shadow-xl"
          role="menu"
        >
          {connectors.length === 0 && (
            <p className="px-4 py-3 text-xs text-white/50">
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
              className="block w-full px-4 py-2.5 text-left text-sm text-white/85 hover:bg-white/5"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
