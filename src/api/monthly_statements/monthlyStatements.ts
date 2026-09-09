import type {
  MonthlyStatementCollectionResponseApi,
  MonthlyStatementListParams,
  MonthlyStatementListResult,
  MonthlyStatementTransferCollectionResponseApi,
  MonthlyStatementTransferListResult,
} from '@/types/monthly_statement';
import { apiRequest } from '@/api/client';
import { monthlyStatementCollectionFromApi, monthlyStatementTransferCollectionFromApi } from '@/transformers/monthly_statement';

function buildPeriodQuery(params: MonthlyStatementListParams): string {
  const search = new URLSearchParams();

  search.set('month', String(params.month));
  search.set('year', String(params.year));

  return search.toString();
}

export async function listMonthlyStatements(params: MonthlyStatementListParams): Promise<MonthlyStatementListResult> {
  const response = await apiRequest<MonthlyStatementCollectionResponseApi>(`/api/v1/monthly_statements?${buildPeriodQuery(params)}`);

  return monthlyStatementCollectionFromApi(response);
}

export async function listMonthlyStatementTransfers(params: MonthlyStatementListParams): Promise<MonthlyStatementTransferListResult> {
  const response = await apiRequest<MonthlyStatementTransferCollectionResponseApi>(
    `/api/v1/monthly_statements/transfers?${buildPeriodQuery(params)}`,
  );

  return monthlyStatementTransferCollectionFromApi(response);
}
