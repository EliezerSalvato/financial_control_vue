import type { TransactionKind, TransactionRecurrenceType } from '@/types/transaction';
import type { CollectionListResult, JsonApiResource, JsonApiUnpaginatedCollectionResponse, YearMonth } from '@/types/api';

export type GoalTransaction = {
  id: string;
  kind: TransactionKind;
  description: string;
  recurrenceType: TransactionRecurrenceType;
  value: number;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  endsOn: string | null;
  categoryId: string | null;
  tagIds: string[];
};

export type GoalTransactionAttributesApi = {
  id: string;
  kind: TransactionKind;
  description: string;
  recurrenceType: TransactionRecurrenceType;
  value: string | number;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  endsOn?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
};

export type GoalTransactionResourceItemApi = JsonApiResource<'goal_transaction', GoalTransactionAttributesApi>;

export type GoalTransactionCollectionResponseApi = JsonApiUnpaginatedCollectionResponse<GoalTransactionResourceItemApi>;

export type GoalListParams = YearMonth;

export type GoalListResult = CollectionListResult<'goalTransactions', GoalTransaction>;
