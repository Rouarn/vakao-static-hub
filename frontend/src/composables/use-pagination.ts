import { ref, computed } from 'vue';

export function usePagination(totalItems: () => number, defaultPageSize = 100) {
  const page = ref(1);
  const pageSize = ref(defaultPageSize);

  const totalPages = computed(() => Math.ceil(totalItems() / pageSize.value));

  const hasMore = computed(() => page.value < totalPages.value);

  function goToPage(p: number) {
    page.value = p;
  }

  function nextPage() {
    if (hasMore.value) page.value++;
  }

  function prevPage() {
    if (page.value > 1) page.value--;
  }

  function reset() {
    page.value = 1;
  }

  return {
    page,
    pageSize,
    totalPages,
    hasMore,
    goToPage,
    nextPage,
    prevPage,
    reset,
  };
}
