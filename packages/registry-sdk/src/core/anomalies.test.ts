import { describe, it, expect } from "vitest";
import { detectAnomalies } from "./anomalies.js";
import type { RegistryPair } from "./types.js";

function pair(p: Partial<RegistryPair> & Pick<RegistryPair, "token" | "wrapper">): RegistryPair {
  return { isValid: true, status: "active", ...p };
}

const A = "0x1111111111111111111111111111111111111111" as const;
const B = "0x2222222222222222222222222222222222222222" as const;
const C = "0x3333333333333333333333333333333333333333" as const;
const D = "0x4444444444444444444444444444444444444444" as const;

describe("detectAnomalies", () => {
  it("flags revoked and interface-mismatch pairs", () => {
    const out = detectAnomalies([
      pair({ token: A, wrapper: B, isValid: false, status: "revoked" }),
      pair({ token: C, wrapper: D, status: "interface-mismatch", supportsERC7984: false }),
    ]);
    expect(out.find((a) => a.kind === "revoked")).toBeTruthy();
    expect(out.find((a) => a.kind === "interface-mismatch")?.severity).toBe("danger");
  });

  it("detects duplicate symbols across different tokens (Sepolia tGBP case)", () => {
    const out = detectAnomalies([
      pair({ token: A, wrapper: B, tokenSymbol: "tGBP" }),
      pair({ token: C, wrapper: D, tokenSymbol: "tGBP" }),
    ]);
    expect(out.filter((a) => a.kind === "duplicate-symbol").length).toBe(2);
  });

  it("flags lookalike symbols (mainnet bbqTGBP ⊃ tGBP)", () => {
    const out = detectAnomalies([
      pair({ token: A, wrapper: B, tokenSymbol: "tGBP" }),
      pair({ token: C, wrapper: D, tokenSymbol: "bbqTGBP" }),
    ]);
    expect(out.find((a) => a.kind === "possible-lookalike" && a.wrapper === D)).toBeTruthy();
  });

  it("returns nothing for a clean set", () => {
    const out = detectAnomalies([
      pair({ token: A, wrapper: B, tokenSymbol: "USDC" }),
      pair({ token: C, wrapper: D, tokenSymbol: "WETH" }),
    ]);
    expect(out).toHaveLength(0);
  });
});
