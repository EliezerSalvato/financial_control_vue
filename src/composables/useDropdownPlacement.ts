import { nextTick, onUnmounted, ref, watch, type CSSProperties, type Ref } from 'vue';

const FALLBACK_MENU_HEIGHT = 16 * 16; // 16rem
const GAP = 4;
const MENU_Z_INDEX = 50; // above Bulma modal (40)

export function useDropdownPlacement(isOpen: Ref<boolean>, trigger: Ref<HTMLElement | null | undefined>, menu: Ref<HTMLElement | null | undefined>) {
  const opensUp = ref(false);
  const menuStyle = ref<CSSProperties>({});

  function applyMenuStyle(rect: DOMRect, openUp: boolean) {
    const space = openUp ? rect.top - GAP : window.innerHeight - rect.bottom - GAP;

    menuStyle.value = {
      position: 'fixed',
      zIndex: MENU_Z_INDEX,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      margin: 0,
      maxHeight: `${Math.min(FALLBACK_MENU_HEIGHT, Math.max(0, space))}px`,
      ...(openUp ? { top: 'auto', bottom: `${window.innerHeight - rect.top + GAP}px` } : { top: `${rect.bottom + GAP}px`, bottom: 'auto' }),
    };
  }

  async function updatePlacement() {
    if (!isOpen.value || !trigger.value) {
      opensUp.value = false;
      menuStyle.value = {};
      return;
    }

    const rect = trigger.value.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    opensUp.value = spaceBelow < FALLBACK_MENU_HEIGHT && spaceAbove > spaceBelow;
    applyMenuStyle(rect, opensUp.value);

    await nextTick();

    if (!isOpen.value || !trigger.value) return;

    const latestRect = trigger.value.getBoundingClientRect();
    const measuredHeight = menu.value?.getBoundingClientRect().height ?? 0;
    const menuHeight = measuredHeight > 0 ? measuredHeight : FALLBACK_MENU_HEIGHT;
    const latestSpaceBelow = window.innerHeight - latestRect.bottom - GAP;
    const latestSpaceAbove = latestRect.top - GAP;

    opensUp.value = latestSpaceBelow < menuHeight && latestSpaceAbove > latestSpaceBelow;
    applyMenuStyle(latestRect, opensUp.value);
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
    menuStyle.value = {};
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
  });

  return { opensUp, menuStyle };
}
