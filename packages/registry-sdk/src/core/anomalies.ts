import type { RegistryPair } from "./types.js";

export type AnomalyKind =
  | "revoked"
  | "interface-mismatch"
  | "duplicate-token"
  | "duplicate-wrapper"
  | "duplicate-symbol"
  | "possible-lookalike";

export type AnomalySeverity = "warning" | "danger";

export interface Anomaly {
  kind: AnomalyKind;
  severity: AnomalySeverity;
  /** The wrapper address of the offending pair (stable id). */
  wrapper: `0x${string}`;
  detail: string;
}

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();

/**
 * Detect suspicious / noteworthy registry entries from the enriched pair set.
 * Pure + deterministic so it's unit-testable and reusable (CLI, UI, monitoring).
 *
 * Catches the real cases reported on the Zama forum:
 *  - mainnet `cbbqTGBP` (underlying "bbqTGBP") → lookalike of tGBP
 *  - Sepolia duplicate tGBP wrappers → duplicate-symbol
 */
export function detectAnomalies(pairs: RegistryPair[]): Anomaly[] {
  const out: Anomaly[] = [];

  const byToken = new Map<string, RegistryPair[]>();
  const byWrapper = new Map<string, RegistryPair[]>();
  const bySymbol = new Map<string, RegistryPair[]>();
  for (const p of pairs) {
    push(byToken, p.token.toLowerCase(), p);
    push(byWrapper, p.wrapper.toLowerCase(), p);
    if (p.tokenSymbol) push(bySymbol, norm(p.tokenSymbol), p);
  }

  for (const p of pairs) {
    if (p.status === "revoked") {
      out.push({ kind: "revoked", severity: "warning", wrapper: p.wrapper, detail: "Pair is revoked (isValid=false) but still present in the registry." });
    }
    if (p.status === "interface-mismatch") {
      out.push({ kind: "interface-mismatch", severity: "danger", wrapper: p.wrapper, detail: "Wrapper does not report the ERC-7984 interface (0x4958f2a4)." });
    }
    if ((byToken.get(p.token.toLowerCase())?.length ?? 0) > 1) {
      out.push({ kind: "duplicate-token", severity: "warning", wrapper: p.wrapper, detail: `Underlying token ${p.token} is registered in multiple pairs.` });
    }
    if ((byWrapper.get(p.wrapper.toLowerCase())?.length ?? 0) > 1) {
      out.push({ kind: "duplicate-wrapper", severity: "warning", wrapper: p.wrapper, detail: `Wrapper ${p.wrapper} appears in multiple pairs.` });
    }
    const sym = norm(p.tokenSymbol);
    if (sym) {
      const sameSymbol = bySymbol.get(sym) ?? [];
      if (sameSymbol.some((o) => o.token.toLowerCase() !== p.token.toLowerCase())) {
        out.push({ kind: "duplicate-symbol", severity: "warning", wrapper: p.wrapper, detail: `Symbol "${p.tokenSymbol}" is shared by different token addresses.` });
      }
      // lookalike: another pair's symbol is a substring of this one (e.g. bbqTGBP ⊃ TGBP)
      for (const other of pairs) {
        const os = norm(other.tokenSymbol);
        if (os && os !== sym && sym.includes(os) && os.length >= 3) {
          out.push({ kind: "possible-lookalike", severity: "danger", wrapper: p.wrapper, detail: `Symbol "${p.tokenSymbol}" looks like a variant of "${other.tokenSymbol}".` });
          break;
        }
      }
    }
  }
  return out;
}

function push<T>(m: Map<string, T[]>, k: string, v: T): void {
  const a = m.get(k);
  if (a) a.push(v);
  else m.set(k, [v]);
}
