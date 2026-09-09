const logoModules = import.meta.glob('@/assets/logos/institutions/pt-BR/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export type InstitutionLogoOption = {
  key: string;
  url: string;
  label: string;
};

function logoKeyFromPath(path: string): string {
  const filename = path.split('/').pop() ?? '';
  return filename.replace(/\.svg$/i, '');
}

function logoLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const institutionLogos: InstitutionLogoOption[] = Object.entries(logoModules)
  .map(([path, url]) => {
    const key = logoKeyFromPath(path);

    return {
      key,
      url,
      label: logoLabel(key),
    };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const logosByKey = new Map(institutionLogos.map((logo) => [logo.key, logo]));

export function listInstitutionLogos(): InstitutionLogoOption[] {
  return institutionLogos;
}

export function institutionLogoUrl(logoKey: string | null | undefined): string | null {
  if (!logoKey) {
    return null;
  }

  return logosByKey.get(logoKey)?.url ?? null;
}
