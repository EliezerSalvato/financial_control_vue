import type { ModelRef } from 'vue';
import { ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { addSortedOption, useCreateOptionModal } from '@/composables/useCreateOptionModal';

type Option = { key: string; label: string };

describe('addSortedOption', () => {
  it('insere ordenado e ignora chave duplicada', () => {
    const items = [{ key: 'b', label: 'Beta' }];

    expect(addSortedOption(items, { key: 'a', label: 'Alpha' })).toEqual([
      { key: 'a', label: 'Alpha' },
      { key: 'b', label: 'Beta' },
    ]);
    expect(addSortedOption(items, { key: 'b', label: 'Outro' })).toEqual(items);
  });
});

describe('useCreateOptionModal', () => {
  it('abre, fecha e seleciona o item criado', () => {
    const items = ref([{ key: 'a', label: 'Alpha' }]) as ModelRef<Option[]>;
    const model = ref('') as ModelRef<string>;
    const { modalOpen, openModal, closeModal, onCreated } = useCreateOptionModal({
      items,
      model,
      mapOption: (entity: { id: string; name: string }) => ({ key: entity.id, label: entity.name }),
    });

    openModal();
    expect(modalOpen.value).toBe(true);

    closeModal();
    expect(modalOpen.value).toBe(false);

    openModal();
    onCreated({ id: 'b', name: 'Beta' });

    expect(items.value.map((item) => item.key)).toEqual(['a', 'b']);
    expect(model.value).toBe('b');
    expect(modalOpen.value).toBe(false);
  });

  it('acrescenta o id em modelos de múltipla escolha sem repetir', () => {
    const items = ref([{ key: 'a', label: 'Alpha' }]) as ModelRef<Option[]>;
    const model = ref(['a']) as ModelRef<string[]>;
    const { onCreated } = useCreateOptionModal({
      items,
      model,
      mapOption: (entity: { id: string; name: string }) => ({ key: entity.id, label: entity.name }),
    });

    onCreated({ id: 'b', name: 'Beta' });
    expect(model.value).toEqual(['a', 'b']);

    onCreated({ id: 'b', name: 'Beta' });
    expect(model.value).toEqual(['a', 'b']);
    expect(items.value).toHaveLength(2);
  });
});
