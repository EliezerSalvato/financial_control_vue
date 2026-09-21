import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import i18n from '@/locales';
import Calendar from '@/components/inputs/Calendar.vue';

function mountCalendar(precision: 'day' | 'month' = 'month') {
  const model = ref<string | null>(null);
  const wrapper = mount(Calendar, {
    props: {
      name: 'goalStartsOn',
      precision,
      modelValue: model.value,
      'onUpdate:modelValue': (value: string | null | undefined) => {
        model.value = value ?? null;
        void wrapper.setProps({ modelValue: value ?? null });
      },
    },
    global: { plugins: [i18n] },
  });

  return { wrapper, model };
}

describe('Calendar month precision', () => {
  it('mostra placeholder MM/YYYY e grava o dia 01', async () => {
    const { wrapper, model } = mountCalendar('month');
    const input = wrapper.get('input[name="goalStartsOn"]');

    expect(input.attributes('placeholder')).toBe('MM/YYYY');
    expect(input.attributes('maxlength')).toBe('7');

    await input.setValue('07/2026');

    expect(model.value).toBe('2026-07-01');
    expect((input.element as HTMLInputElement).value).toBe('07/2026');
  });

  it('restringe o seletor nativo ao mês mínimo', () => {
    const wrapper = mount(Calendar, {
      props: {
        name: 'goalEndsOn',
        precision: 'month',
        min: '2026-02-01',
        modelValue: null,
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.get('input[type="month"]').attributes('min')).toBe('2026-02');
  });

  it('lê um ISO completo e exibe só mês e ano', async () => {
    const wrapper = mount(Calendar, {
      props: {
        name: 'goalEndsOn',
        precision: 'month',
        modelValue: '2026-12-01',
      },
      global: { plugins: [i18n] },
    });

    expect((wrapper.get('input[name="goalEndsOn"]').element as HTMLInputElement).value).toBe('12/2026');
  });
});
