/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the engine and the Anthropic SDK out of the bundler: they run only in
  // the Node server route and depend on Node built-ins.
  serverExternalPackages: ['@anthropic-ai/sdk', 'datapitfalls'],
  // Web linting isn't wired into this slice yet; the root CI lints the engine.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
