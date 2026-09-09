import type { ModelRef } from 'vue';
import { ref } from 'vue';

type SelectOption = { key: string; label: string };

export function addSortedOption<T extends SelectOption>(items: T[], option: T): T[] {
  if (items.some((item) => item.key === option.key)) return items;

  return [...items, option].sort((a, b) => a.label.localeCompare(b.label));
}

export function useCreateOptionModal<TEntity, TOption extends SelectOption, TModel extends string | string[]>(options: {
  items: ModelRef<TOption[]>;
  model: ModelRef<TModel>;
  mapOption: (entity: TEntity) => TOption;
}) {
  const modalOpen = ref(false);

  function addOption(entity: TEntity) {
    options.items.value = addSortedOption(options.items.value, options.mapOption(entity));
  }

  function closeModal() {
    modalOpen.value = false;
  }

  function openModal() {
    modalOpen.value = true;
  }

  function onCreated(entity: TEntity) {
    addOption(entity);

    const id = options.mapOption(entity).key;
    const current = options.model.value;

    if (Array.isArray(current)) {
      if (!current.includes(id)) {
        options.model.value = [...current, id] as TModel;
      }
    } else {
      options.model.value = id as TModel;
    }

    closeModal();
  }

  return {
    modalOpen,
    openModal,
    closeModal,
    onCreated,
  };
}
