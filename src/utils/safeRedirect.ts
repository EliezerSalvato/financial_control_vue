export function safeRedirectPath(redirect: unknown, fallback = '/'): string {
  if (typeof redirect !== 'string') return fallback;

  if (!redirect.startsWith('/') || redirect.startsWith('//')) return fallback;

  if (redirect.includes('\\')) return fallback;

  return redirect;
}
