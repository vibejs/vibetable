import {
  computed,
  effectScope,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  watch,
  watchEffect,
} from '@usevibejs/ui';
import type { Ref } from '@usevibejs/ui';
import type { Atom, Observer, ReadonlyAtom, Subscription } from '@tanstack/store';
import type { TableAtomOptions, TableReactivityBindings } from '@tanstack/table-core/reactivity';

/** Isolates a read using a short-lived public watcher, without an internal tracking API. */
function untrack<T>(fn: () => T): T {
  let result!: T;
  let failure: { error: unknown } | undefined;
  const stop = watchEffect(
    () => {
      try {
        result = fn();
      } catch (error) {
        failure = { error };
      }
    },
    { flush: 'sync' },
  );
  stop();
  if (failure) throw failure.error;
  return result;
}

/** Creates native atoms owned by the active Vibe effect scope. */
export function vibeReactivity(): TableReactivityBindings {
  const parent = getCurrentScope();
  if (!parent?.active) throw new Error('VibeTable requires an active component or effect scope.');
  const scope = effectScope();
  const subscriptions = new Set<Subscription>();
  scope.run(() =>
    onScopeDispose(() => {
      for (const subscription of subscriptions) subscription.unsubscribe();
      subscriptions.clear();
    }),
  );

  function readonlyAtom<T>(source: Readonly<Ref<T>>): ReadonlyAtom<T> {
    return {
      get: () => source.value,
      subscribe(observer: Observer<T> | ((value: T) => void)): Subscription {
        if (!scope.active) return { unsubscribe() {} };
        const stop = scope.run(() =>
          watch(
            () => source.value,
            (value) => {
              if (typeof observer === 'function') observer(value);
              else observer.next?.(value);
            },
            { flush: 'sync' },
          ),
        );
        return { unsubscribe: () => stop?.() };
      },
    };
  }

  return {
    createOptionsStore: true,
    wrapExternalAtoms: true,
    createWritableAtom<T>(value: T, options?: TableAtomOptions<T>): Atom<T> {
      const source = shallowRef(value);
      return {
        ...readonlyAtom(source),
        set(updater: T | ((previous: T) => T)): void {
          const previous = untrack(() => source.value);
          const next =
            typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater;
          if (!options?.compare?.(previous, next)) source.value = next;
        },
      };
    },
    createReadonlyAtom<T>(fn: () => T, options?: TableAtomOptions<T>): ReadonlyAtom<T> {
      let initialized = false;
      return readonlyAtom(
        computed<T>((previous) => {
          const next = fn();
          if (initialized && options?.compare?.(previous as T, next)) return previous as T;
          initialized = true;
          return next;
        }),
      );
    },
    addSubscription(subscription) {
      subscriptions.add(subscription);
    },
    untrack,
    // Vibe batches DOM jobs in its scheduler. It exposes no public synchronous batch primitive.
    batch: (fn) => fn(),
    schedule(fn) {
      queueMicrotask(() => {
        if (scope.active) untrack(fn);
      });
    },
    unmount: () => scope.stop(),
  };
}

/** An externally owned native state slice. Create it in the same scope as its table. */
export function useTableAtom<T>(initialValue: T): Atom<T> {
  return vibeReactivity().createWritableAtom(initialValue);
}
