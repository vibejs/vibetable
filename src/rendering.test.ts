import { expect, it } from 'vitest';
import type { Component } from '@usevibejs/ui';
import { componentRenderer, isComponentContent, renderContent } from './rendering.ts';
it('renders scalar templates and escapes markup at the interpolation boundary', () => {
  for (const value of ['<b>unsafe</b>', 1, 2n, false, null, undefined]) {
    expect(renderContent(value, {})).toBe(value);
    expect(isComponentContent(value)).toBe(false);
  }
  expect(renderContent(({ value }) => value.toFixed(2), { value: 12 })).toBe('12.00');
});
it('registers declarative components and rejects unsupported render outputs', () => {
  const component = {
    render() {
      return [];
    },
  } as Component<(props: { context: { value: number } }) => { slots: {}; exposed: {}; emits: {} }>;
  const render = componentRenderer(component);
  const context = { value: 3 };
  const content = renderContent(render, context);
  expect(isComponentContent(content)).toBe(true);
  expect(content).toEqual({ kind: 'component', component, context });
  for (const value of [{}, { kind: 'text' }, Symbol('x'), () => 'nested']) {
    expect(() => renderContent(() => value, {})).toThrow('Table content must be text');
  }
});
