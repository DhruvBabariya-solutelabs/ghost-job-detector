/**
 * Closed Shadow-DOM mount via WXT's createShadowRootUi helper.
 *
 * WHY WXT's helper, not hand-rolled:
 * - Auto-injects `all: initial !important` on the host element (CONTEXT D-46 + D-57)
 * - cssInjectionMode: 'ui' bundles overlay.css into the shadow root only
 *   (no leak into host page <head>) — PITFALL 1 mitigation
 * - mode: 'closed' = closed shadow root (D-57); host page cannot read
 *   shadowRoot via the host element's .shadowRoot property
 * - Clean ui.mount() / ui.remove() lifecycle for soft-nav re-mounts
 *
 * Acceptable D-57 deviation: WXT injects CSS via a <style> element (not
 * style injection via element). Functionally equivalent for our single-stylesheet
 * case — RESEARCH §"Verified Pattern Override".
 */

import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createRoot, type Root } from 'react-dom/client';

export interface OverlayMount {
  ui: Awaited<ReturnType<typeof createShadowRootUi>>;
  /** Returns the React root inside the shadow root for the consumer to call .render(...). */
  getRoot: () => Root | null;
}

/**
 * Mounts a closed shadow root at <html>, anchored as 'overlay' (fixed-position
 * positioning context). Returns the WXT ui handle + a React root for the
 * caller (content.ts orchestrator) to render against.
 *
 * The actual React tree is supplied by Plan 04-07's Overlay component.
 */
export async function mountOverlayShadow(ctx: ContentScriptContext): Promise<OverlayMount> {
  let root: Root | null = null;

  const ui = await createShadowRootUi(ctx, {
    name: 'gjd-overlay',
    position: 'overlay',
    anchor: 'html',
    mode: 'closed',
    isolateEvents: ['keydown', 'keyup'],
    onMount: (container) => {
      const mountPoint = document.createElement('div');
      container.appendChild(mountPoint);
      root = createRoot(mountPoint);
      return root;
    },
    onRemove: (r) => {
      r?.unmount();
      root = null;
    },
  });

  ui.mount();

  return {
    ui,
    getRoot: () => root,
  };
}
