import type { NextConfig } from 'next';

/**
 * Next.js 15 config — Foundation phase.
 *
 * `transpilePackages` is the load-bearing line: it tells Next.js to compile
 * @ghost/shared and @ghost/scoring directly from their source `.ts` files
 * instead of expecting a pre-built `dist/`. This is what makes FOUND-05
 * ("import from @ghost/shared without a build step") true.
 *
 * Do NOT remove these entries when adding new shared packages — add to them.
 */
const nextConfig: NextConfig = {
  transpilePackages: ['@ghost/shared', '@ghost/scoring'],
  reactStrictMode: true,
  // Next.js 15.5 promoted typedRoutes out of `experimental` to a top-level
  // config key. Using the new top-level form silences the deprecation warning.
  typedRoutes: true,
  // Resolve .js imports to .ts/.tsx for bundler-mode TypeScript packages.
  // @ghost/shared and @ghost/scoring use NodeNext-style .js extensions in their
  // imports (required by tsc --moduleResolution bundler), but webpack cannot
  // resolve these without this alias — it looks for literal .js files.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
