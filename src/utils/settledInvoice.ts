import type { InvoiceSettlement } from '@/types/credit_card';
import { toDateKey } from '@/utils/settledOccurrence';

type InvoiceGroup = {
  resourceId: string;
  openingDate: string;
  closingDate: string;
  dueDate: string | null;
};

export function settledOnForInvoice(invoiceSettlements: InvoiceSettlement[], group: InvoiceGroup): string | undefined {
  const opening = toDateKey(group.openingDate);
  const closing = toDateKey(group.closingDate);
  const due = toDateKey(group.dueDate);

  return invoiceSettlements.find((invoice) => {
    if (invoice.creditCardId !== group.resourceId) return false;

    if (toDateKey(invoice.openingDate) !== opening) return false;

    if (toDateKey(invoice.closingDate) !== closing) return false;

    if (due && toDateKey(invoice.dueDate) !== due) return false;

    return true;
  })?.settledOn;
}
