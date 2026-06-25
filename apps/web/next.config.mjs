/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Consume the SDK as TypeScript source (no prebuild step in the monorepo).
  transpilePackages: ["@cwr/registry-sdk"],
  // Lint runs via `pnpm lint` / CI typecheck, not as a build gate (keeps deps lean for now).
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // wagmi/walletconnect pull in optional native deps that aren't needed in the browser.
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Resolve the SDK's ESM-correct ".js" specifiers to their ".ts" source.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
