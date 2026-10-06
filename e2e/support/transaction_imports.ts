import type { Page, Route } from '@playwright/test';
import type { CableMock } from './app';
import { apiPath, fulfillJson } from './http';

export type ImportPreviewRowRecord = {
  row: number;
  date: string;
  description: string;
  amount: string;
  recurrenceType?: 'one_time' | 'installment' | 'recurring';
  category?: { id?: string; name: string; new: boolean } | null;
  tags?: Array<{ id?: string; name: string; new: boolean }>;
  status?: 'processed' | 'skip' | 'error';
  error?: string;
};

export const IMPORT_ID = 'import-1';

export const defaultImportPreviewRows: ImportPreviewRowRecord[] = [
  { row: 1, date: '2026-09-10', description: 'Uber trip', amount: '45.90', category: { id: '2', name: 'Transport', new: false } },
  { row: 2, date: '2026-09-12', description: 'Supermarket', amount: '230.00', category: { id: '1', name: 'Food', new: false } },
  { row: 3, date: '2026-09-15', description: 'Gym', amount: '99.90', category: { name: 'Health', new: true } },
];

export type ImportPreviewRequest = {
  kind: string;
  paymentMethod: string;
  accountId: string;
  creditCardId: string;
  fileName: string;
};

export type ImportConfirmRow = {
  row: number;
  create: boolean;
  description: string;
  amount: string;
  category_id?: string;
  category_name?: string;
  recurrence_type: string;
};

function multipartField(body: string, name: string): string {
  const match = new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n]*)`).exec(body);

  return match?.[1] ?? '';
}

function multipartFileName(body: string): string {
  return /name="file"; filename="([^"]*)"/.exec(body)?.[1] ?? '';
}

export class TransactionImportsApi {
  previewRows: ImportPreviewRowRecord[];
  previewRequests: ImportPreviewRequest[] = [];
  confirmRequests: Array<{ import_id: string; rows: ImportConfirmRow[] }> = [];
  failPreviewWith: Record<string, string[]> | null = null;
  failConfirm = false;
  private cable: CableMock;

  constructor(cable: CableMock, previewRows: ImportPreviewRowRecord[] = defaultImportPreviewRows) {
    this.cable = cable;
    this.previewRows = previewRows;
  }

  async handle(route: Route) {
    const request = route.request();
    const path = apiPath(request.url());
    const method = request.method();

    if (path.endsWith('/imports/previews') && method === 'POST') return this.preview(route);

    if (path.endsWith('/imports') && method === 'POST') return this.confirm(route);

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private async preview(route: Route) {
    if (this.failPreviewWith) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: this.failPreviewWith }, 422);
    }

    const body = route.request().postData() ?? '';

    this.previewRequests.push({
      kind: multipartField(body, 'kind'),
      paymentMethod: multipartField(body, 'payment_method'),
      accountId: multipartField(body, 'account_id'),
      creditCardId: multipartField(body, 'credit_card_id'),
      fileName: multipartFileName(body),
    });

    await fulfillJson(route, { status: 'success', data: { import_id: IMPORT_ID, total_rows: this.previewRows.length } });

    const request = this.previewRequests.at(-1);

    this.broadcast(this.previewRows.map((row) => this.previewEvent(row, request)));
  }

  private previewEvent(row: ImportPreviewRowRecord, request: ImportPreviewRequest | undefined) {
    const status = row.status ?? 'processed';

    if (status !== 'processed') {
      return { import_id: IMPORT_ID, stage: 'preview', row: row.row, status, error: row.error };
    }

    return {
      import_id: IMPORT_ID,
      stage: 'preview',
      row: row.row,
      status,
      data: {
        date: row.date,
        description: row.description,
        original_description: row.description,
        amount: row.amount,
        recurrence_type: row.recurrenceType ?? 'one_time',
        ends_on: null,
        kind: request?.kind ?? 'expense',
        payment_method: request?.paymentMethod ?? 'pix',
        account_id: request?.accountId || null,
        credit_card_id: request?.creditCardId || null,
        limit_consumption_type: null,
        installments_count: null,
        category: row.category ?? null,
        tags: row.tags ?? [],
        source_key: `source-${row.row}`,
      },
    };
  }

  private async confirm(route: Route) {
    if (this.failConfirm) {
      return fulfillJson(route, { status: 'error', message: 'Import failed', details: {} }, 422);
    }

    const payload = (await route.request().postDataJSON()) as { import_id: string; rows: ImportConfirmRow[] };

    this.confirmRequests.push(payload);

    await fulfillJson(route, { status: 'success', data: { import_id: payload.import_id, total_rows: payload.rows.length } });

    this.broadcast(
      payload.rows.map((row) => ({
        import_id: payload.import_id,
        stage: 'import',
        row: row.row,
        status: row.create ? 'created' : 'ignored',
        transaction_id: row.create ? String(100 + row.row) : undefined,
      })),
    );
  }

  // The page may still be connecting its websocket when the request is answered, so events are re-sent; the app keys them by row.
  private broadcast(messages: unknown[]) {
    for (const delay of [0, 300, 1000]) {
      setTimeout(() => {
        try {
          messages.forEach((message) => this.cable.sendToChannel({ channel: 'TransactionImportChannel' }, message));
        } catch {
          // the page was closed before the event was delivered
        }
      }, delay);
    }
  }
}

export async function mockTransactionImportsApi(page: Page, imports: TransactionImportsApi) {
  await page.route(/\/api\/v1\/transactions\/imports(\/|\?|$)/, (route) => imports.handle(route));

  return imports;
}
