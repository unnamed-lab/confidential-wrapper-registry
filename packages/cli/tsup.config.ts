import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  // Bundle the workspace SDK source into the binary; keep installed deps (viem) external.
  // The shebang in src/index.ts is preserved by tsup automatically.
  noExternal: ["@cwr/registry-sdk"],
});
