import { getFrame } from './phone-chrome.ts'
import type { ReconcilerTask } from '../core/reconciler-core.ts'

/**
 * dsh-file-viewer open marker. The plugin renders a
 * <section class="dsfv-panel" data-conversation-composer-overlay> as a
 * conversation.view tab next to "对话"/"轨迹" (its own idempotent <style>
 * uses the stable `dsfv-` prefix — no CSS Modules). When that panel is in
 * the DOM we mark the plugin frame with `data-file-viewer-open`, which
 * compat.css uses to scope the mobile file-viewer layout, and which the
 * sidebar-swipe layer treats as a takeover so left-edge horizontal swipes
 * (CSV tables / code) win over the drawer gesture. Idempotent like the other
 * frame markers; dispose clears it when the tab unmounts or on deactivation.
 * Scoped to the mobile branch because the reconciler only runs when the
 * mobile breakpoint is active (registerReconcileTasks installs it there).
 */
export function createFileViewerMarkerTask(): ReconcilerTask {
  return {
    name: 'file-viewer-open-marker',
    scopes: ['*'],
    ensure: () => {
      const frame = getFrame()
      if (frame === null) return
      const active = document.querySelector('[data-conversation-composer-overlay]') !== null
      if (active) {
        frame.setAttribute('data-file-viewer-open', '')
      } else if (frame.hasAttribute('data-file-viewer-open')) {
        frame.removeAttribute('data-file-viewer-open')
      }
    },
    dispose: () => {
      getFrame()?.removeAttribute('data-file-viewer-open')
    },
  }
}