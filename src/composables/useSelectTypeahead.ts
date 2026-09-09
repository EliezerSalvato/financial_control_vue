const RESET_MS = 500;

export function useSelectTypeahead() {
  let query = '';
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  function clearQuery() {
    query = '';
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
  }

  function scheduleReset() {
    if (resetTimer) clearTimeout(resetTimer);

    resetTimer = setTimeout(() => {
      query = '';
      resetTimer = null;
    }, RESET_MS);
  }

  function findIndex(labels: string[], key: string, currentIndex = -1): number {
    if (key.length !== 1 || !/\p{L}|\p{N}/u.test(key)) {
      return -1;
    }

    const char = key.toLocaleLowerCase();
    const isRepeat = query.length === 1 && query === char;

    query = isRepeat ? char : `${query}${char}`;
    scheduleReset();

    const normalized = labels.map((label) => label.toLocaleLowerCase());

    if (isRepeat) {
      for (let offset = 1; offset <= normalized.length; offset += 1) {
        const index = (Math.max(currentIndex, -1) + offset) % normalized.length;
        if (normalized[index]?.startsWith(char)) {
          return index;
        }
      }
      return -1;
    }

    return normalized.findIndex((label) => label.startsWith(query));
  }

  return { findIndex, clearQuery };
}
