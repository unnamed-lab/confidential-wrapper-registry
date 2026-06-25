import { describe, it, expect } from "vitest";
import { deriveStatus } from "./status.js";

describe("deriveStatus", () => {
  it("flags revoked pairs regardless of interface support", () => {
    expect(deriveStatus({ isValid: false, supportsERC7984: true })).toBe("revoked");
    expect(deriveStatus({ isValid: false, supportsERC7984: false })).toBe("revoked");
  });

  it("flags interface mismatch only for valid pairs that failed the on-chain check", () => {
    expect(deriveStatus({ isValid: true, supportsERC7984: false })).toBe("interface-mismatch");
  });

  it("treats a valid, interface-supporting pair as active", () => {
    expect(deriveStatus({ isValid: true, supportsERC7984: true })).toBe("active");
  });

  it("is optimistic before enrichment (interface check not yet run)", () => {
    expect(deriveStatus({ isValid: true })).toBe("active");
  });
});
