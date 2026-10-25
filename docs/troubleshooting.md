# Troubleshooting and limitations

| Symptom                                                   | Cause and resolution                                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Active-scope error                                        | Call useTable/useTableAtom in setup or a live effectScope; stop manually created scopes                   |
| Data changes do not update values                         | Replace the array and edited records; in-place mutation does not invalidate Core caches                   |
| UI looks stale after destructuring                        | Keep reads in templates/computed/watch sources; destructuring a scalar result captures a snapshot         |
| A controlled slice does not change                        | Supply its on[Slice]Change callback or use an external writable atom                                      |
| Replacing atoms/features has no effect                    | Those options are static by Core contract; update atom values or recreate the owner                       |
| A getter gets called as a callback                        | Field getters are supported for data/columns/state; use refs or a whole-options getter for scalar options |
| Sorting/filter functions are unknown                      | Register the function under features.sortFns/filterFns, using its exact name on the column                |
| A row model option is rejected                            | Use v9 factories under features; do not mix v8 get...RowModel APIs                                        |
| Heterogeneous column assignment fails                     | Preserve accessor values with helper.columns rather than widening every column to unknown                 |
| Render output is rejected                                 | Return scalar text or componentRenderer output; put markup in a compiled .vibe component or slot          |
| Dynamic component context is untyped                      | Register with componentRenderer; a raw dynamic outlet cannot validate props in current Vibe               |
| Selection IDs exist but rows do not                       | Manual pagination only has loaded data; use IDs for server bulk operations                                |
| Page changes reset unexpectedly                           | Review Core's autoResetPageIndex/autoResetAll settings and data-reference stability                       |
| A pinned column does not stick                            | Core owns pinning state; provide pinned-column CSS/rendering in your application copy                     |
| Virtualized content cannot all be read by a screen reader | Offscreen records are absent from the DOM; offer paginated traversal                                      |
| A static host returns 404 for example invoices            | Host the sample API separately; the included endpoint runs in Vite dev/preview                            |
| Compiler/runtime mismatch                                 | Install matching Vibe.js package versions; the plugin checks them                                         |

Vibe.js currently lacks generic `.vibe` components, public JSX/render functions and public synchronous batch/untrack primitives. The adapter uses supported refs/watchers and declarative composition to accommodate them. Core rows remain ordinary stable objects; no deep proxy is placed around a table. Vibecn's structural slot view erases row originals, while registered custom components retain exact generics. Synchronous multi-slice notifications are not transactional.

Vibe's public createApp type currently expects a root without required props. Wrap a required-prop table component in an ordinary App.vibe template and pass its props there; the independent consumer test uses this declarative composition. No Vibe.js files were changed.

The package supports the current client-rendered Vibe release. SSR/hydration, a spreadsheet grid renderer, dynamic-height virtual rows, a reusable virtualization package and a separately tested VibeQuery example are not implemented. Core cell selection/spanning and pinning state are exported/tested, but custom renderers are responsible for their visual/keyboard interaction. These boundaries do not affect ordinary table sorting, filtering, pagination, selection or typed component cells.
