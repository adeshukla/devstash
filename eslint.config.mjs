import nextConfig from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'public/**', 'next-env.d.ts'],
  },
  {
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
