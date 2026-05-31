import { createRoot, type Root } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';

export interface OverlayMount {
  ui: Awaited<ReturnType<typeof createShadowRootUi>>;
  getRoot: () => Root | null;
}

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
