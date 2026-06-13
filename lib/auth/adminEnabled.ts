// True only in local development. In any production runtime the admin is absent.
export function isAdminEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}
