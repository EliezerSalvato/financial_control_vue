import type { MonthlyStatusAttributesApi, MonthlyStatusResourceItemApi, MonthlyStatusSuccessResponseApi } from '@/types/monthly_status';
import { describe, expect, it } from 'vitest';
import {
  monthlyStatusFromResource,
  monthlyStatusProcessingFromApi,
  monthlyStatusShowFromApi,
  monthlyStatusUpdateFromApi,
} from '@/transformers/monthly_status';

const resource: MonthlyStatusResourceItemApi = {
  id: 'ms-1',
  type: 'monthly_status',
  attributes: {
    id: 'ms-1',
    month: 9,
    year: 2026,
    status: 'open',
    processing: true,
    lastProcessedAt: '2026-09-09T12:00:00.000Z',
  },
};

describe('monthlyStatusFromResource', () => {
  it('mapeia o recurso para o domínio', () => {
    expect(monthlyStatusFromResource(resource)).toEqual({
      id: 'ms-1',
      month: 9,
      year: 2026,
      status: 'open',
      processing: true,
      lastProcessedAt: '2026-09-09T12:00:00.000Z',
    });
  });

  it('usa id do recurso e trata processing e lastProcessedAt vazios', () => {
    expect(
      monthlyStatusFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: {
          month: 1,
          year: 2026,
          status: 'closed',
          lastProcessedAt: '',
        } as MonthlyStatusAttributesApi,
      }),
    ).toEqual({
      id: 'fallback-id',
      month: 1,
      year: 2026,
      status: 'closed',
      processing: false,
      lastProcessedAt: null,
    });
  });
});

describe('monthlyStatus show / update', () => {
  it('devolve o status no show e a mensagem no update', () => {
    const response: MonthlyStatusSuccessResponseApi = {
      status: 'success',
      type: 'object',
      message: 'Month closed',
      data: resource,
    };

    expect(monthlyStatusShowFromApi(response)).toEqual(monthlyStatusFromResource(resource));
    expect(monthlyStatusUpdateFromApi(response)).toEqual({
      message: 'Month closed',
      monthlyStatus: monthlyStatusFromResource(resource),
    });
  });

  it('usa mensagem vazia quando o update não envia message', () => {
    expect(
      monthlyStatusUpdateFromApi({
        status: 'success',
        type: 'object',
        data: resource,
      }).message,
    ).toBe('');
  });
});

describe('monthlyStatusProcessingFromApi', () => {
  it('normaliza snake_case e trata lastProcessedAt vazio', () => {
    expect(
      monthlyStatusProcessingFromApi({
        processing: true,
        last_processed_at: '2026-09-09T12:00:00.000Z',
      }),
    ).toEqual({
      processing: true,
      lastProcessedAt: '2026-09-09T12:00:00.000Z',
    });

    expect(monthlyStatusProcessingFromApi({ processing: 0, last_processed_at: '' })).toEqual({
      processing: false,
      lastProcessedAt: null,
    });
  });
});
