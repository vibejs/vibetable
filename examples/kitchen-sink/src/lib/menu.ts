// Shared behavior of dropdown menus, context menus and menubars.
import { ref, watch, type Ref, type ShallowRef } from '@usevibejs/ui';
import { createTypeahead, logicalKey, nextItem } from './collection.ts';
import {
  anchorOf,
  injectOverlay,
  provideOverlay,
  useFloating,
  usePopover,
  type OverlayContext,
  type Placement,
  type Side,
} from './overlay.ts';

export interface Menubar {
  /** Opens the menu `delta` positions away from menu `id`, focusing its first item. */
  move: (id: string, delta: number) => void;
}

export interface MenuState {
  /** What receives focus when the menu opens; keyboard opening asks for an item. */
  focusOnOpen: Ref<'first' | 'last' | 'content'>;
  /** The id of the submenu that is open in this menu. */
  openSub: Ref<string | null>;
  parent?: MenuContext;
  /** Where a context menu opens, instead of next to a trigger. */
  point?: Ref<{ x: number; y: number } | null>;
  menubar?: Menubar;
}

export type MenuContext = OverlayContext & MenuState;

export function provideMenu(open: Ref<boolean>, extra: Partial<MenuState> = {}): MenuContext {
  return provideOverlay<MenuState>('Menu', open, {
    focusOnOpen: ref('content'),
    openSub: ref(null),
    ...extra,
  });
}

export const injectMenu = (): MenuContext => injectOverlay<MenuState>('Menu');

const rootOf = (menu: MenuContext): MenuContext => (menu.parent ? rootOf(menu.parent) : menu);

/** Focuses the trigger of `menu`: its button, or the item that opens a submenu. */
const focusTrigger = (menu: MenuContext): void =>
  (anchorOf(menu.id) as HTMLElement | null)?.focus();

/** Closes every level of the menu and returns focus to the trigger. */
export function closeMenu(menu: MenuContext): void {
  const root = rootOf(menu);
  root.open.value = false;
  focusTrigger(root);
}

/**
 * The behavior of a menu's content: shown as a popover next to its trigger (or the context menu's
 * point), focus on open, arrow keys, typeahead, Escape, Tab and moving across a menubar.
 */
export function useMenuContent(
  content: Readonly<ShallowRef<HTMLElement | null>>,
  menu: MenuContext,
  placement: () => Placement,
): {
  onToggle: (event: Event) => void;
  onKeydown: (event: KeyboardEvent) => void;
  side: Ref<Side>;
} {
  const onToggle = usePopover(content, menu.open);
  const anchor = () => {
    const point = menu.point?.value;
    return point ? { top: point.y, left: point.x, width: 0, height: 0 } : anchorOf(menu.id);
  };
  const side = useFloating(anchor, content, () => menu.open.value, placement);
  const items = (): HTMLElement[] =>
    [...content.value!.querySelectorAll<HTMLElement>('[role^="menuitem"]')].filter(
      (item) =>
        item.closest('[role="menu"]') === content.value && !item.hasAttribute('data-disabled'),
    );
  const typeahead = createTypeahead();

  watch(
    menu.open,
    (open) => {
      if (!open) {
        menu.openSub.value = null;
        return;
      }
      const list = items();
      const target = { first: list[0], last: list[list.length - 1], content: content.value }[
        menu.focusOnOpen.value
      ];
      (target ?? content.value)!.focus();
      menu.focusOnOpen.value = 'content';
    },
    { flush: 'post' },
  );

  const onKeydown = (event: KeyboardEvent): void => {
    // Typed characters belong to the innermost menu, even without a match.
    if (event.key.length === 1 && event.key !== ' ') event.stopPropagation();
    const list = items();
    const key = logicalKey(event.key, content.value);
    const active = document.activeElement;
    const next = nextItem(list, active, key, 'vertical', false) ?? typeahead(key, list, active);
    const handled = (): void => {
      event.preventDefault();
      event.stopPropagation();
    };
    if (next) {
      handled();
      next.focus();
    } else if (key === 'Escape' || (key === 'ArrowLeft' && menu.parent)) {
      handled();
      menu.open.value = false;
      focusTrigger(menu);
    } else if (key === 'Tab') {
      rootOf(menu).open.value = false;
    } else if (menu.menubar && !menu.parent && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      handled();
      menu.menubar.move(menu.id, key === 'ArrowRight' ? 1 : -1);
    }
  };
  return { onToggle, onKeydown, side };
}

/**
 * The behavior of a menu item: hover focuses it and closes other submenus, Enter and Space
 * activate it, and a click emits a cancelable `select` event and closes the menu unless the
 * listener prevents it.
 */
export function useMenuItem(
  menu: MenuContext,
  disabled: () => boolean,
  select: (event: Event) => void,
): {
  onPointerMove: (event: PointerEvent) => void;
  onPointerLeave: (event: PointerEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onClick: () => void;
} {
  return {
    onPointerMove: (event) => {
      if (disabled()) return;
      (event.currentTarget as HTMLElement).focus();
      menu.openSub.value = null;
    },
    onPointerLeave: (event) => {
      (event.currentTarget as HTMLElement).closest<HTMLElement>('[role="menu"]')!.focus();
    },
    onKeydown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      (event.currentTarget as HTMLElement).click();
    },
    onClick: () => {
      if (disabled()) return;
      const event = new Event('select', { cancelable: true });
      select(event);
      if (!event.defaultPrevented) closeMenu(menu);
    },
  };
}

/** Keeps a submenu's open state in step with its parent: one submenu open at a time. */
export function useSubmenu(open: Ref<boolean>, sub: MenuContext): void {
  const parent = sub.parent!;
  watch(open, (value) => {
    if (value) parent.openSub.value = sub.id;
  });
  watch([parent.openSub, parent.open], ([current, parentOpen]) => {
    if (current !== sub.id || !parentOpen) open.value = false;
  });
}
