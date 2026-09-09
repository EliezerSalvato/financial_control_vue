import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '@/utils/safeRedirect';

describe('safeRedirectPath', () => {
  it('aceita caminhos relativos internos', () => {
    expect(safeRedirectPath('/tags')).toBe('/tags');
    expect(safeRedirectPath('/users/profile?tab=email')).toBe('/users/profile?tab=email');
  });

  it('rejeita valores que não são path interno', () => {
    expect(safeRedirectPath('https://evil.example')).toBe('/');
    expect(safeRedirectPath('//evil.example')).toBe('/');
    expect(safeRedirectPath('\\evil')).toBe('/');
    expect(safeRedirectPath('tags')).toBe('/');
    expect(safeRedirectPath(null)).toBe('/');
    expect(safeRedirectPath({ path: '/tags' })).toBe('/');
  });

  it('usa o fallback informado', () => {
    expect(safeRedirectPath('https://evil.example', '/home')).toBe('/home');
  });
});
