import { computed, effectScope, ref, watchEffect } from '@usevibejs/ui';
import { expect, it, vi } from 'vitest';
import { vibeReactivity } from './reactivity.ts';
import { scoped } from '../test/helpers.ts';

it('requires a live scope', () => {
  expect(() => vibeReactivity()).toThrow('active component or effect scope');
});
it('implements native writable/readonly atoms, custom equality and both observer forms', () =>
  scoped(() => {
    const bridge = vibeReactivity();
    expect(() =>
      bridge.untrack(() => {
        throw new Error('read failed');
      }),
    ).toThrow('read failed');
    const value = bridge.createWritableAtom(
      { count: 1 },
      { debugName: 'value', compare: (a, b) => a.count === b.count },
    );
    const next = vi.fn<(value: { count: number }) => void>();
    const object = vi.fn<(value: { count: number }) => void>();
    const empty = value.subscribe({});
    const first = value.subscribe(next);
    const second = value.subscribe({ next: object });
    value.set({ count: 1 });
    expect(next).not.toHaveBeenCalled();
    value.set((previous) => ({ count: previous.count + 1 }));
    expect(next).toHaveBeenCalledExactlyOnceWith({ count: 2 });
    expect(object).toHaveBeenCalledOnce();
    const derived = bridge.createReadonlyAtom(() => ({ count: value.get().count % 2 }), {
      debugName: 'parity',
      compare: (a, b) => a.count === b.count,
    });
    const observer = vi.fn<(value: { count: number }) => void>();
    const subscription = derived.subscribe(observer);
    const original = derived.get();
    value.set({ count: 4 });
    expect(derived.get()).toBe(original);
    expect(observer).not.toHaveBeenCalled();
    value.set({ count: 5 });
    expect(derived.get()).toEqual({ count: 1 });
    expect(observer).toHaveBeenCalledOnce();
    const unconfigured = bridge.createReadonlyAtom(() => value.get().count);
    expect(unconfigured.get()).toBe(5);
    first.unsubscribe();
    second.unsubscribe();
    subscription.unsubscribe();
    empty.unsubscribe();
    value.set({ count: 6 });
    expect(object).toHaveBeenCalledTimes(3);
  }));
it('untracks Core reads and schedules cancellable microtasks', async () => {
  const scope = effectScope();
  const signal = ref(0);
  const job = vi.fn<() => void>();
  const cancelled = vi.fn<() => void>();
  const subscribed = vi.fn<() => void>();
  const bridge = scope.run(() => vibeReactivity())!;
  scope.run(() =>
    watchEffect(
      () => {
        bridge.untrack(() => signal.value);
        subscribed();
      },
      { flush: 'sync' },
    ),
  );
  signal.value++;
  expect(subscribed).toHaveBeenCalledOnce();
  bridge.schedule(job);
  await Promise.resolve();
  expect(job).toHaveBeenCalledOnce();
  bridge.schedule(cancelled);
  bridge.unmount?.();
  scope.stop();
  await Promise.resolve();
  expect(cancelled).not.toHaveBeenCalled();
  const unsubscribe = vi.fn<() => void>();
  const owner = effectScope();
  const live = owner.run(() => vibeReactivity())!;
  live.addSubscription({ unsubscribe });
  owner.stop();
  expect(unsubscribe).toHaveBeenCalledOnce();
  live.unmount?.();
  expect(unsubscribe).toHaveBeenCalledOnce();
});
it('keeps readonly atoms lazy and isolates updater reads from option tracking', () =>
  scoped(() => {
    const bridge = vibeReactivity();
    const atom = bridge.createWritableAtom(0);
    const read = vi.fn<() => number>(() => atom.get() + 1);
    const derived = bridge.createReadonlyAtom(read);
    expect(read).not.toHaveBeenCalled();
    const result = computed(() => derived.get());
    expect(result.value).toBe(1);
    expect(result.value).toBe(1);
    expect(read).toHaveBeenCalledOnce();
    bridge.batch(() => atom.set(2));
    expect(result.value).toBe(3);
  }));
