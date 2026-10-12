import type { NextConfig } from "next";

/**
 * Two ways to run the same app:
 *  - default: normal Next.js server (`npm run dev`, `npm run build && npm start`)
 *  - DEPLOY_TARGET=pages: static export served from a GitHub Pages project site
 *    (https://<user>.github.io/<repo>/), which needs a base path.
 */
const pages = process.env.DEPLOY_TARGET === "pages";
const repo = process.env.PAGES_BASE_PATH ?? "/tradingbot";

const nextConfig: NextConfig = {
  ...(pages
    ? {
        output: "export",
        basePath: repo,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
