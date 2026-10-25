import { nextTick } from '@usevibejs/ui';
import { mount } from '@usevibejs/ui/testing';
import { expect, it } from 'vitest';
import Table from './fixtures/Table.vibe';
it('mounts real .vibe headers/cells, sorts, updates data and preserves keyed DOM', async () => {
  const w = mount(Table, {
    props: {
      data: [
        { id: 'a', name: 'Grace', amount: 12.5 },
        { id: 'b', name: 'Ada', amount: 7 },
      ],
    },
  });
  const first = w.element.querySelector('[data-row="a"]')!;
  expect(first.querySelector('strong')!.textContent).toBe('12.50');
  (w.element.querySelector('th button') as HTMLButtonElement).click();
  await nextTick();
  expect(w.element.querySelector('tbody tr')!.getAttribute('data-row')).toBe('b');
  expect(w.element.querySelector('[data-row="a"]')).toBe(first);
  (first.querySelector('input') as HTMLInputElement).click();
  await nextTick();
  expect(first.querySelector('strong')!.getAttribute('data-selected')).toBe('true');
  await w.setProps({ data: [{ id: 'a', name: '<script>unsafe</script>', amount: 99.25 }] });
  expect(w.element.querySelector('[data-row="a"]')).toBe(first);
  expect(first.querySelector('strong')!.textContent).toBe('99.25');
  expect(first.textContent).toContain('<script>unsafe</script>');
  expect(first.querySelector('script')).toBeNull();
  const table = w.emitted('ready')![0][0];
  w.unmount();
  table.setSorting([]);
  await nextTick();
  expect(first.isConnected).toBe(false);
});
