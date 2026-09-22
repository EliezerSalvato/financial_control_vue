import type { Page } from '@playwright/test';
import type { AccountRecord } from './accounts';
import type { CategoryRecord } from './categories';
import type { CreditCardRecord, InvoiceSettlementRecord } from './credit_cards';
import type { InstitutionRecord } from './institutions';
import type { GoalTargetRecord, GoalTransactionRecord } from './goals';
import type { MonthlyStatementRecord, MonthlyStatementTransferRecord } from './monthly_statements';
import type { MonthlyStatusRecord } from './monthly_statuses';
import type { NotificationRecord } from './notifications';
import type { TagRecord } from './tags';
import type { SettledTransactionRecord, TransactionRecord } from './transactions';
import { AccountsApi, mockAccountsApi } from './accounts';
import { GuestAuthApi, mockGuestAuthApi } from './auth';
import { CategoriesApi, mockCategoriesApi } from './categories';
import { CreditCardsApi, mockCreditCardsApi } from './credit_cards';
import { GoalsApi, mockGoalsApi } from './goals';
import { InstitutionsApi, mockInstitutionsApi } from './institutions';
import { mockMonthlyStatementsApi, MonthlyStatementsApi } from './monthly_statements';
import { mockMonthlyStatusesApi, MonthlyStatusesApi } from './monthly_statuses';
import { mockNotificationsApi, NotificationsApi } from './notifications';
import { mockProfileApi, ProfileApi } from './profile';
import { mockSettlementsApi, SettlementsApi } from './settlements';
import { mockTagsApi, TagsApi } from './tags';
import { mockTransactionsApi, TransactionsApi } from './transactions';
import { createSessionState, mockCable, mockSessionRefresh, setLocaleCookie } from './app';

type SetupOptions = {
  authenticated?: boolean;
  tags?: TagRecord[];
  categories?: CategoryRecord[];
  institutions?: InstitutionRecord[];
  accounts?: AccountRecord[];
  creditCards?: CreditCardRecord[];
  transactions?: TransactionRecord[];
  goalTransactions?: GoalTransactionRecord[];
  goalTargets?: GoalTargetRecord[];
  monthlyStatements?: MonthlyStatementRecord[];
  monthlyStatementTransfers?: MonthlyStatementTransferRecord[];
  monthlyStatuses?: MonthlyStatusRecord[];
  settledTransactions?: SettledTransactionRecord[];
  invoiceSettlements?: InvoiceSettlementRecord[];
  notifications?: NotificationRecord[];
  perPage?: number;
};

export async function setupApp(page: Page, baseURL: string | undefined, options: SetupOptions = {}) {
  const authenticated = options.authenticated ?? true;
  const session = createSessionState(authenticated);
  const auth = new GuestAuthApi(session);
  const profile = new ProfileApi(session);
  const tags = new TagsApi(options.tags, options.perPage);
  const categories = new CategoriesApi(options.categories, options.perPage);
  const institutions = new InstitutionsApi(options.institutions, options.perPage);
  const accounts = new AccountsApi(options.accounts, options.perPage);
  const creditCards = new CreditCardsApi(options.creditCards, options.perPage);
  const transactions = new TransactionsApi(options.transactions, options.perPage);
  const goals = new GoalsApi(options.goalTransactions, options.goalTargets);
  const monthlyStatements = new MonthlyStatementsApi(options.monthlyStatements, options.monthlyStatementTransfers);
  const monthlyStatuses = new MonthlyStatusesApi(options.monthlyStatuses);
  const notifications = new NotificationsApi(options.notifications ?? []);
  const settlements = new SettlementsApi();

  if (options.settledTransactions) {
    transactions.settledTransactions = options.settledTransactions.map((settled) => ({ ...settled }));
  }

  if (options.invoiceSettlements) {
    creditCards.invoiceSettlements = options.invoiceSettlements.map((invoice) => ({ ...invoice }));
  }

  await setLocaleCookie(page, baseURL);
  const cable = await mockCable(page);
  await mockSessionRefresh(page, session);
  await mockProfileApi(page, profile);
  await mockGuestAuthApi(page, auth);
  await mockNotificationsApi(page, notifications);
  await mockTagsApi(page, tags);
  await mockCategoriesApi(page, categories);
  await mockInstitutionsApi(page, institutions);
  await mockAccountsApi(page, accounts);
  await mockCreditCardsApi(page, creditCards);
  await mockTransactionsApi(page, transactions);
  await mockGoalsApi(page, goals);
  await mockMonthlyStatementsApi(page, monthlyStatements);
  await mockMonthlyStatusesApi(page, monthlyStatuses);
  await mockSettlementsApi(page, settlements);

  return {
    session,
    auth,
    profile,
    tags,
    categories,
    institutions,
    accounts,
    creditCards,
    transactions,
    goals,
    monthlyStatements,
    monthlyStatuses,
    notifications,
    settlements,
    cable,
  };
}
