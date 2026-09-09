import type { InstallmentLabelSource } from '@/utils/installmentLabel';
import { describe, expect, it } from 'vitest';
import { installmentLabel } from '@/utils/installmentLabel';

function source(overrides: Partial<InstallmentLabelSource> = {}): InstallmentLabelSource {
  return {
    recurrenceType: 'installment',
    firstRecurrenceOn: '2026-01-20',
    currentRecurrenceOn: '2026-01-20',
    openingDate: '2026-01-11',
    closingDate: '2026-02-10',
    endsOn: '2026-04-20',
    canceledOn: null,
    ...overrides,
  };
}

describe('installmentLabel', () => {
  it('não rotula transação à vista', () => {
    expect(installmentLabel(source({ recurrenceType: 'one_time' }))).toBe('');
  });

  it('conta o ciclo atual e o total da parcela', () => {
    expect(installmentLabel(source())).toBe(' - 1/4');
    expect(
      installmentLabel(
        source({
          currentRecurrenceOn: '2026-02-20',
          openingDate: '2026-02-11',
          closingDate: '2026-03-10',
        }),
      ),
    ).toBe(' - 2/4');
  });

  it('usa infinito quando a recorrência não tem data final', () => {
    expect(installmentLabel(source({ recurrenceType: 'recurring', endsOn: null }))).toBe(' - 1/∞');
  });

  it('recalcula o total quando a recorrência foi cancelada', () => {
    expect(installmentLabel(source({ canceledOn: '2026-03-25', endsOn: '2026-12-20' }))).toBe(' - 1/3');
  });

  it('não passa do total quando o ciclo atual ultrapassa o fim', () => {
    expect(
      installmentLabel(
        source({
          currentRecurrenceOn: '2026-05-20',
          openingDate: '2026-05-11',
          closingDate: '2026-06-10',
        }),
      ),
    ).toBe(' - 4/4');
  });

  it('retorna vazio quando as datas do ciclo são inválidas', () => {
    expect(installmentLabel(source({ openingDate: 'invalid', closingDate: 'also-invalid' }))).toBe('');
  });
});
