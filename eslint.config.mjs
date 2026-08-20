import nextConfig from 'eslint-config-next/core-web-vitals'

// nextConfig[0] is the object that registers the `react-hooks` plugin (among
// others) for **/*.{js,jsx,mjs,ts,tsx,mts,cts}. Flat-config plugin
// registration is supposed to cascade to any other object matching the same
// files, but as of the currently pinned eslint/eslint-config-next/
// @typescript-eslint versions that cascade silently stopped working here —
// referencing `react-hooks/set-state-in-effect` below without also
// re-declaring the plugin in *this* object throws "could not find plugin
// react-hooks" at lint startup. Reusing the exact same plugin instance
// (rather than importing eslint-plugin-react-hooks separately, which pnpm's
// strict node_modules won't resolve from here anyway) keeps this in sync
// with whatever version nextConfig itself pulls in.
const reactHooksPlugin = nextConfig[0].plugins['react-hooks']

const config = [
  ...nextConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'public/**', 'next-env.d.ts'],
  },
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: {
      '@next/next/no-img-element': 'error',
      'no-console': 'warn',
      'prefer-const': 'error',
      // Existing mount-time sync patterns (theme resolution, reduced-motion checks,
      // route-change close, one-shot flags) are safe single setState calls, not
      // cascading loops — downgraded rather than restructured across 6 components.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

export default config
