"use client";

import { useState } from "react";
import { generateSnippet, type RegistryPair, type SnippetFlavor } from "@cwr/registry-sdk/react";
import { Copy, Check } from "lucide-react";

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
    <div className="rounded-xl border border-white/5 bg-[#05060b]/60 backdrop-blur-md shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-3.5 py-2.5 bg-white/[0.01]">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Snippet Libraries">
          {FLAVORS.map((f) => {
            const isSel = flavor === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={isSel}
                onClick={() => setFlavor(f)}
                className={`rounded-md px-3 py-1 text-xs font-semibold font-space tracking-wide uppercase transition-all duration-200 ${
                  isSel 
                    ? "bg-brand/15 text-brand border border-brand/25" 
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold font-space tracking-wide uppercase text-white/60 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all duration-250"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-active" />
              <span className="text-active">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 bg-[#020306]/85">
        <pre className="overflow-x-auto text-[11px] font-mono leading-relaxed text-[#c3c8db] custom-scrollbar scrollbar-thin">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
