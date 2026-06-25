"use client";

import { useState } from "react";
import { generateSnippet, type RegistryPair, type SnippetFlavor } from "@cwr/registry-sdk/react";

const FLAVORS: SnippetFlavor[] = ["wagmi", "viem", "ethers"];

export function SnippetBlock({ pair, chainId }: { pair: RegistryPair; chainId: number }) {
  const [flavor, setFlavor] = useState<SnippetFlavor>("wagmi");
  const [copied, setCopied] = useState(false);
  const code = generateSnippet(pair, flavor, { chainId });

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-white/10">
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
        {FLAVORS.map((f) => (
          <button
            key={f}
            onClick={() => setFlavor(f)}
            aria-pressed={flavor === f}
            className={`rounded-md px-3 py-1 text-xs transition ${
              flavor === f ? "bg-white/10 text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={copy}
          className="ml-auto rounded-md px-2.5 py-1 text-xs text-white/70 ring-1 ring-white/10 hover:bg-white/5 hover:text-white"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-white/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}
