import type { Component, ComponentProps, Handle } from '@usevibejs/ui';

/** The only prop passed to a registered cell/header component. */
export interface TableComponentProps<TContext extends object> {
  context: TContext;
}

/** A declarative component selection, rendered with <component :is> by the consumer. */
export interface ComponentContent {
  readonly kind: 'component';
  readonly component: Component;
  readonly context: object;
}

export type TextContent = string | number | bigint | boolean | null | undefined;
export type TableContent = TextContent | ComponentContent;

/**
 * Checks a .vibe component's context and all required props at registration time.
 * Pass the result directly as column.cell/header. No mounting or DOM work happens here.
 */
export function componentRenderer<
  C extends Component<(props: { context: never }) => Handle<unknown, unknown, unknown>>,
>(
  component: C,
): (
  context: ComponentProps<C> extends { context: infer T extends object } ? T : never,
) => ComponentContent {
  return (context) => ({
    kind: 'component',
    component: component as unknown as Component,
    context,
  });
}

/** Evaluates a text template or registered component without interpreting strings as HTML. */
export function renderContent<TContext extends object>(
  template: TextContent | ((context: TContext) => unknown),
  context: TContext,
): TableContent {
  const content: unknown = typeof template === 'function' ? template(context) : template;
  if (
    content === null ||
    content === undefined ||
    typeof content === 'string' ||
    typeof content === 'number' ||
    typeof content === 'bigint' ||
    typeof content === 'boolean'
  )
    return content;
  if (
    typeof content === 'object' &&
    'kind' in content &&
    content.kind === 'component' &&
    'component' in content &&
    'context' in content
  )
    return content as ComponentContent;
  throw new TypeError(
    'Table content must be text or componentRenderer(Component) output. Use a .vibe component or a slot for markup.',
  );
}

/** Narrows content for declarative dynamic-component outlets. */
export function isComponentContent(content: TableContent): content is ComponentContent {
  return typeof content === 'object' && content !== null;
}
