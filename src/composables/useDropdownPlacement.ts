import { nextTick, onUnmounted, ref, watch, type Ref } from 'vue';

const FALLBACK_MENU_HEIGHT = 16 * 16; // 16rem
const GAP = 4;

export function useDropdownPlacement(isOpen: Ref<boolean>, trigger: Ref<HTMLElement | null | undefined>, menu: Ref<HTMLElement | null | undefined>) {
  const opensUp = ref(false);

  async function updatePlacement() {
    if (!isOpen.value || !trigger.value) {
      opensUp.value = false;
      return;
    }

    await nextTick();

    const rect = trigger.value.getBoundingClientRect();
    const measuredHeight = menu.value?.getBoundingClientRect().height ?? 0;
    const menuHeight = measuredHeight > 0 ? measuredHeight : FALLBACK_MENU_HEIGHT;
    const spaceBelow = window.innerHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    opensUp.value = spaceBelow < menuHeight && spaceAbove > spaceBelow;
  }

  function onViewportChange() {
    if (isOpen.value) {
      void updatePlacement();
    }
  }

  watch(isOpen, (open) => {
    if (open) {
      void updatePlacement();
      window.addEventListener('resize', onViewportChange);
      window.addEventListener('scroll', onViewportChange, true);
      return;
    }

    opensUp.value = false;
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
  });

  return { opensUp };
}
