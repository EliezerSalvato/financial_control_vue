<script setup lang="ts">
import type { Pagination } from '@/types/api';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  pagination: Pagination | null;
}>();

const emit = defineEmits<{
  'change:page': [page: number];
}>();

const { t } = useI18n();

const currentPage = computed(() => props.pagination?.currentPage ?? 1);
const prevPage = computed(() => props.pagination?.prevPage ?? null);
const nextPage = computed(() => props.pagination?.nextPage ?? null);
const totalPages = computed(() => props.pagination?.totalPages ?? 0);
const totalCount = computed(() => props.pagination?.totalCount ?? 0);

const fromRecord = computed(() => (props.pagination?.offsetValue ?? 0) + 1);
const toRecord = computed(() => (props.pagination?.offsetValue ?? 0) + (props.pagination?.size ?? 0));

const pagesList = computed(() => {
  const limitPages = 2;
  const displayablePages: number[] = [];
  const firstPage = currentPage.value - limitPages;
  const lastPage = currentPage.value + limitPages;

  for (let i = firstPage; i <= lastPage; i++) {
    if (i >= 1 && i <= totalPages.value) {
      displayablePages.push(i);
    }
  }

  return displayablePages;
});

function changePage(page: number) {
  emit('change:page', page);
}
</script>

<template>
  <div>
    <div v-if="totalCount" class="is-pulled-left is-hidden-touch">
      {{
        t('paginator.displaying', {
          from: fromRecord,
          to: toRecord,
          total: totalCount,
        })
      }}
    </div>
    <div v-else class="is-pulled-left">{{ t('paginator.noRecords') }}</div>
    <div class="is-pulled-right">
      <nav class="pagination">
        <div class="is-hidden-desktop">
          <a v-if="prevPage != null" rel="prev" class="pagination-link" @click="changePage(prevPage)">
            {{ t('paginator.prev') }}
          </a>
          <a v-if="nextPage != null" rel="next" class="pagination-link" @click="changePage(nextPage)">
            {{ t('paginator.next') }}
          </a>
        </div>

        <ul class="pagination-list">
          <li v-if="prevPage != null">
            <a class="pagination-link" @click="changePage(1)">{{ t('paginator.first') }}</a>
          </li>

          <li v-if="prevPage != null" class="is-hidden-touch">
            <a rel="prev" class="pagination-link" @click="changePage(prevPage)">
              {{ t('paginator.prev') }}
            </a>
          </li>

          <li v-for="page in pagesList" :key="page">
            <a
              v-if="pagesList.length > 1"
              rel="prev"
              class="pagination-link"
              :class="{
                'is-current': currentPage == page,
                'is-hidden-touch': ![prevPage, currentPage, nextPage].includes(page),
              }"
              @click="changePage(page)"
            >
              {{ page }}
            </a>
          </li>

          <li v-if="nextPage != null" class="is-hidden-touch">
            <a rel="next" class="pagination-link" @click="changePage(nextPage)">
              {{ t('paginator.next') }}
            </a>
          </li>

          <li v-if="nextPage != null">
            <a class="pagination-link" @click="changePage(totalPages)">
              {{ t('paginator.last') }}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.pagination-link {
  margin: 3px;
}
</style>
