export function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(prefix));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(prefix.length));
}

export function setCookie(name: string, value: string, expires: string): void {
  document.cookie = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, `expires=${expires}`, 'path=/', 'SameSite=Lax'].join('; ');
}
