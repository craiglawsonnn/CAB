// Mirrors next.config.js's basePath logic exactly. next.config.js only
// rewrites URLs for assets it controls (its own JS/CSS chunks via
// assetPrefix); plain <img src> paths sourced from content/site.ts are never
// rewritten by Next, so they must be prefixed manually using this constant.
export const basePath = process.env.GITHUB_PAGES === 'true' ? '/CAB' : '';
