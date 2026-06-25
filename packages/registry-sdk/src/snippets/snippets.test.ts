import { describe, it, expect } from "vitest";
import { generateSnippet } from "./index.js";
import type { RegistryPair } from "../core/types.js";

const pair: RegistryPair = {
  token: "0x1111111111111111111111111111111111111111",
  wrapper: "0x2222222222222222222222222222222222222222",
  isValid: true,
  tokenSymbol: "USDC",
  tokenDecimals: 6,
  wrapperSymbol: "cUSDC",
  supportsERC7984: true,
  status: "active",
};

describe("generateSnippet", () => {
  it.each(["wagmi", "viem", "ethers"] as const)("%s snippet embeds the real wrapper address and chainId", (flavor) => {
    const out = generateSnippet(pair, flavor, { chainId: 11155111, amount: "5" });
    expect(out).toContain(pair.wrapper);
    expect(out).toContain("11155111");
    expect(out).toContain("createWrappedToken");
  });

  it("uses the token's real decimals in parseUnits", () => {
    const out = generateSnippet(pair, "viem", { chainId: 1 });
    expect(out).toContain("parseUnits(\"1.0\", 6)");
  });

  it("falls back to 18 decimals and TOKEN symbol when un-enriched", () => {
    const bare: RegistryPair = { token: pair.token, wrapper: pair.wrapper, isValid: true, status: "active" };
    const out = generateSnippet(bare, "ethers", { chainId: 1 });
    expect(out).toContain(", 18)");
    expect(out).toContain("TOKEN");
  });
});
