/** Turns Supabase / network errors into a short, friendly sentence. */
export function friendlyError(err) {
  const msg = err?.message || String(err || '')
  if (/duplicate key|already exists/i.test(msg)) return 'That name or link is already used. Try another.'
  if (/row-level security|permission|not authorized|jwt/i.test(msg)) return 'You are not allowed to do that. Try logging in again.'
  if (/failed to fetch|network/i.test(msg)) return 'No connection. Check your internet and try again.'
  return msg || 'Something went wrong. Please try again.'
}
