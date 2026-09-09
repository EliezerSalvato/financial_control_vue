import { describe, expect, it } from 'vitest';
import { institutionLogoUrl, listInstitutionLogos } from '@/utils/institutionLogos';

describe('institutionLogos', () => {
  it('lista logos ordenados e resolve a url pela chave', () => {
    const logos = listInstitutionLogos();

    expect(logos.length).toBeGreaterThan(0);
    expect(logos.map((logo) => logo.key)).toEqual(logos.map((logo) => logo.key).sort());
    expect(institutionLogoUrl('nu-bank')).toBe(logos.find((logo) => logo.key === 'nu-bank')?.url);
  });

  it('devolve null para chave vazia ou desconhecida', () => {
    expect(institutionLogoUrl(null)).toBeNull();
    expect(institutionLogoUrl(undefined)).toBeNull();
    expect(institutionLogoUrl('unknown-bank')).toBeNull();
  });
});
