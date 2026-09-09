import { describe, expect, it } from 'vitest';
import { listNetworkLogos, networkLogoUrl } from '@/utils/networkLogos';

describe('networkLogos', () => {
  it('lista logos ordenados e resolve a url pela chave', () => {
    const logos = listNetworkLogos();

    expect(logos.length).toBeGreaterThan(0);
    expect(logos.map((logo) => logo.key)).toEqual(logos.map((logo) => logo.key).sort());
    expect(logos.find((logo) => logo.key === 'visa')).toMatchObject({ key: 'visa', label: 'Visa' });
    expect(networkLogoUrl('visa')).toBe(logos.find((logo) => logo.key === 'visa')?.url);
  });

  it('devolve null para chave vazia ou desconhecida', () => {
    expect(networkLogoUrl(null)).toBeNull();
    expect(networkLogoUrl(undefined)).toBeNull();
    expect(networkLogoUrl('unknown-network')).toBeNull();
  });
});
