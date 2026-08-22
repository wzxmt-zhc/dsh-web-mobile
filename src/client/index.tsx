import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { MobileNavToggle } from './MobileNavToggle.tsx'
import { MobileDrawerFooter } from './MobileDrawerFooter.tsx'
import { MOBILE_CSS } from './styles/index.ts'
import { installDebugBadge } from './debug.ts'
import { installFrameController, installOverlayInteractions, installPhoneChrome, installReconciler, registerReconcileTasks } from './effects/phone-chrome.ts'
import { installAionuiCompat } from './effects/aionui-compat.ts'
import { NS, en, zh } from './locales.ts'
import type { MobileNavKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Directory-drawer controls copy. */
    'mobileNav': MobileNavKey
  }
}

/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
export const inject = ['slots', 'layout', 'locale', 'sessionLogDownload', 'sessions']

/**
 * Mobile-adaptive shell, browser half: injects the mobile stylesheet, then
 * contributes the directory toggle to the session header and the backdrop +
 * floating button to the shell overlay.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mobile-nav: dictionaries')

  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = '@dsh-external/dsh-mobile-nav'
    tag.dataset.pluginCss = '@dsh-external/dsh-mobile-nav/mobile.css'
    tag.textContent = MOBILE_CSS
    document.head.appendChild(tag)
    // Keep this stylesheet last in <head> so its overrides win over the
    // host UI's own styles (some host rules also use !important).
    setTimeout(() => {
      if (tag.isConnected) document.head.appendChild(tag)
    }, 0)
    return () => {
      tag.remove()
    }
  }, 'dsh-mobile-nav: styles')

  // Hard-fix the installed-plugins list text layout: the host market UI
  // injects its own CSS after this plugin's stylesheet, so CSS overrides can
  // be beaten. Inline !important styles win over every external rule.
  ctx.effect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const set = (el: HTMLElement, props: Record<string, string>): void => {
      for (const [key, value] of Object.entries(props)) {
        el.style.setProperty(key, value, 'important')
      }
    }
    const apply = (): void => {
      if (!mq.matches) return
      document.querySelectorAll<HTMLElement>('[class*="irow"]').forEach((row) => {
        set(row, {
          'flex-wrap': 'wrap',
          'align-items': 'center',
          'gap': '4px 10px',
        })
        const first = row.children[0] as HTMLElement | undefined
        if (first) {
          set(first, {
            'flex': '1 1 100%',
            'max-width': '100%',
            'min-width': '0',
          })
        }
        row.querySelectorAll<HTMLElement>(':scope > button[class*="switch"]').forEach((el) => {
          set(el, { 'order': '3' })
        })
        row.querySelectorAll<HTMLElement>(':scope > button:not([class*="switch"])').forEach((el) => {
          set(el, { 'order': '2' })
        })
        row.querySelectorAll<HTMLElement>(':scope > [class*="owner"]').forEach((el) => {
          set(el, { 'order': '1' })
        })
        row.querySelectorAll<HTMLElement>(':scope > [class*="grow"]').forEach((el) => {
          set(el, { 'order': '0' })
        })
        const spec = row.querySelector<HTMLElement>('[class*="spec"]')
        const nm = row.querySelector<HTMLElement>('[class*="nm"]')
        if (spec) {
          set(spec, {
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'max-width': '100%',
          })
        }
        if (nm) {
          set(nm, {
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'max-width': '100%',
          })
        }
      })
    }
    apply()
    const mo = new MutationObserver(apply)
    mo.observe(document.documentElement, { childList: true, subtree: true })
    const onMq = (): void => {
      if (mq.matches) apply()
    }
    mq.addEventListener('change', onMq)
    return () => {
      mo.disconnect()
      mq.removeEventListener('change', onMq)
    }
  }, 'dsh-mobile-nav: installed-list-inline-styles')


  // Shared mobile infrastructure: frame marker ownership and the single
  // full-tree reconciler. Installed inside one effect so a plugin reload in
  // the same JS environment tears the whole reconciler down and rebuilds it.
  ctx.effect(() => {
    const stops = [
      installFrameController(),
      installReconciler(ctx),
      registerReconcileTasks(ctx),
    ]
    return () => {
      for (const stop of stops) stop()
    }
  }, 'dsh-mobile-nav: reconciler infrastructure')

  // Diagnostic overlay for phone-side repros (?mobile-nav-debug=1).
  installDebugBadge(ctx)

  // Drawer close interactions: Escape and navigation taps inside the drawer.
  installOverlayInteractions(ctx)

  installPhoneChrome(ctx)

  installAionuiCompat(ctx)

  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'mobile-nav-toggle',
    order: 10,
    locale: NS,
    inject: () => ({
      toggleSidebar: () => ctx.layout.toggleSidebar(),
    }),
  }, MobileNavToggle))


  // Session log download, relocated from the session header to the drawer
  // footer on mobile (the header capsule is hidden by CSS); the drawer
  // footer also hosts the Files action that opens the dsh-web-ui explorer
  // sheet.
  //
  // Footer stacking relies on the list-slot sort by (priority, order):
  // dsh-remote-web-ui leaves it unset (default 0, its two icon buttons stay
  // on top) and dsh-usage-stats uses 10. Order 5 keeps the Files + Session
  // log pills directly under the icon row with the usage/balance badge
  // below them — instead of a tie at 10 where registration order could
  // wedge the badge between the icons and the pills.
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'mobile-nav-session-log',
    order: 5,
    locale: NS,
    inject: () => {
      // `ctx.sessions.refresh()` repulls the session baseline; rc.6 keeps it
      // off the ISessions face (wire-pump internals), so probe the concrete
      // service — every version this plugin supports carries it.
      const refresh = (ctx.sessions as { refresh?: () => Promise<void> }).refresh
      return {
        downloadSessionLog: (sessionId: string) => ctx.sessionLogDownload.download(sessionId),
        toggleSidebar: () => ctx.layout.toggleSidebar(),
        refreshSessions: () => (refresh === undefined ? Promise.resolve() : refresh()),
        clearSessions: () => ctx.sessions.clear(),
      }
    },
  }, MobileDrawerFooter))
}

// Type-only augmentation imports: pull the layout / conversation / sidebar /
// settings SlotMap merges and the sessionLogDownload service typing into this
// program without any runtime import.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-session-log-export/client'
