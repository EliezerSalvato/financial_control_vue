import type { Ref } from 'vue';
import type { LocationQuery, LocationQueryRaw, RouteRecordName } from 'vue-router';
import { appQueryToRoute, routeQueryToApp } from '@/utils/routeQuery';
import { notifyApiError } from '@/utils/notifyApiError';
import { useRoute, useRouter } from 'vue-router';
import { computed, onUnmounted, ref, watch } from 'vue';

export type SortDirection = 'asc' | 'desc';
export type SortEntry<TField extends string> = { field: TField; direction: SortDirection };

export type IndexListLoadParams = {
  page: number;
  perPage: number | undefined;
  sort?: string;
};

const FILTER_DEBOUNCE_MS = 400;

export function queryString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parsePositiveInt(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : NaN;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function parsePage(value: unknown): number {
  return parsePositiveInt(value) ?? 1;
}

export function parseActiveQuery(value: unknown): string {
  const active = queryString(value);

  return active === 'true' || active === 'false' ? active : '';
}

export function booleanFilterValue(value: string | null | undefined): boolean | undefined {
  if (value === 'true') return true;

  if (value === 'false') return false;

  return undefined;
}

function isSortDirection(value: string): value is SortDirection {
  return value === 'asc' || value === 'desc';
}

function serializeQuery(query: LocationQuery | LocationQueryRaw): string {
  const params = new URLSearchParams();

  for (const key of Object.keys(query).sort()) {
    const value = query[key];

    if (typeof value === 'string' && value !== '') {
      params.set(key, value);
    }
  }

  return params.toString();
}

export function useIndexListQuery<TField extends string>(options: {
  routeName: RouteRecordName;
  sortableFields: readonly TField[];
  extraQuery: () => Record<string, string>;
  applyExtraQuery: (query: Record<string, unknown>) => void;
  load: (params: IndexListLoadParams) => Promise<void>;
}) {
  const route = useRoute();
  const router = useRouter();
  const sortableFields = new Set<string>(options.sortableFields);

  const loading = ref(false);
  const hasLoadedOnce = ref(false);
  const page = ref(1);
  const perPage = ref<number | undefined>(undefined);
  const sorts = ref([]) as Ref<SortEntry<TField>[]>;
  const debounceClears: Array<() => void> = [];

  const showLoading = computed(() => loading.value && !hasLoadedOnce.value);
  const showTableLoading = computed(() => loading.value && hasLoadedOnce.value);
  const sortParam = computed(() => sorts.value.map((entry) => `${entry.field} ${entry.direction}`).join(', '));

  function isSortField(value: string): value is TField {
    return sortableFields.has(value);
  }

  function parseSort(value: unknown): SortEntry<TField>[] {
    const raw = queryString(value).trim();

    if (!raw) {
      return [];
    }

    const entries: SortEntry<TField>[] = [];

    for (const part of raw.split(',')) {
      const [field, direction] = part.trim().split(/\s+/);

      if (!field || !direction || !isSortField(field) || !isSortDirection(direction)) {
        continue;
      }

      if (entries.some((entry) => entry.field === field)) {
        continue;
      }

      entries.push({ field, direction });
    }

    return entries;
  }

  function sortDirection(field: TField): SortDirection | null {
    return sorts.value.find((item) => item.field === field)?.direction ?? null;
  }

  function toggleSort(field: TField) {
    const index = sorts.value.findIndex((entry) => entry.field === field);

    if (index === -1) {
      sorts.value = [...sorts.value, { field, direction: 'asc' }];
    } else if (sorts.value[index]?.direction === 'asc') {
      sorts.value = sorts.value.map((entry, entryIndex) => (entryIndex === index ? { field, direction: 'desc' } : entry));
    } else {
      sorts.value = sorts.value.filter((_, entryIndex) => entryIndex !== index);
    }

    void changePage(1);
  }

  function applyQueryToState() {
    const query = routeQueryToApp<Record<string, unknown>>(route.query);

    options.applyExtraQuery(query);
    sorts.value = parseSort(query.sort);
    page.value = parsePage(query.page);
    perPage.value = parsePositiveInt(query.perPage);
  }

  async function fetchData() {
    loading.value = true;

    try {
      await options.load({
        page: page.value,
        perPage: perPage.value,
        sort: sortParam.value || undefined,
      });
    } catch (error) {
      notifyApiError(error);
    } finally {
      loading.value = false;
      hasLoadedOnce.value = true;
    }
  }

  function buildQuery(nextPage: number): LocationQueryRaw {
    const query: Record<string, string> = { ...options.extraQuery() };

    if (nextPage > 1) {
      query.page = String(nextPage);
    }

    if (perPage.value != null) {
      query.perPage = String(perPage.value);
    }

    if (sortParam.value) {
      query.sort = sortParam.value;
    }

    return appQueryToRoute(query);
  }

  async function changePage(nextPage: number) {
    const query = buildQuery(nextPage);

    if (serializeQuery(route.query) === serializeQuery(query)) {
      page.value = nextPage;
      void fetchData();
      return;
    }

    await router.replace({ name: options.routeName, query });
  }

  function clearDebouncedFilters() {
    debounceClears.forEach((clear) => clear());
  }

  function createDebouncedFilter() {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    function clear() {
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = null;
      }
    }

    function trigger() {
      clear();
      timeout = setTimeout(() => {
        timeout = null;
        void changePage(1);
      }, FILTER_DEBOUNCE_MS);
    }

    debounceClears.push(clear);

    return trigger;
  }

  function filterChange() {
    clearDebouncedFilters();
    void changePage(1);
  }

  watch(
    () => route.query,
    () => {
      applyQueryToState();
      void fetchData();
    },
    { deep: true, immediate: true },
  );

  onUnmounted(clearDebouncedFilters);

  return {
    page,
    perPage,
    sorts,
    sortParam,
    showLoading,
    showTableLoading,
    sortDirection,
    toggleSort,
    changePage,
    filterChange,
    createDebouncedFilter,
  };
}
