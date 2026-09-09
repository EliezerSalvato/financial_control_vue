const logoModules = import.meta.glob('@/assets/networks/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export type NetworkLogoOption = {
  key: string;
  url: string;
  label: string;
};

function logoKeyFromPath(path: string): string {
  const filename = path.split('/').pop() ?? '';
  return filename.replace(/\.svg$/i, '');
}

function logoLabel(key: string): string {
  return key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const networkLogos: NetworkLogoOption[] = Object.entries(logoModules)
  .map(([path, url]) => {
    const key = logoKeyFromPath(path);

    return {
      key,
      url,
      label: logoLabel(key),
    };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const logosByKey = new Map(networkLogos.map((logo) => [logo.key, logo]));

export function listNetworkLogos(): NetworkLogoOption[] {
  return networkLogos;
}

export function networkLogoUrl(logoKey: string | null | undefined): string | null {
  if (!logoKey) {
    return null;
  }

  return logosByKey.get(logoKey)?.url ?? null;
}
