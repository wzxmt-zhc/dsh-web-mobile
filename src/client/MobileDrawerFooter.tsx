import { useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  IconDownloadOutline16,
  IconPanelLeftOutline16,
  IconTrashOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { NS } from './locales.ts'
import { getFrame } from './effects/phone-chrome.ts'

/** Full props for the sidebar footer action entry. */
export interface MobileDrawerFooterProps extends PropsRuntime<'sidebar.footer.action'>, PropsLocale<typeof NS> {
  /** Bound ctx.sessionLogDownload.download() for the current session. */
  downloadSessionLog: (sessionId: string) => void
  /** Bound ctx.layout.toggleSidebar(): the Files sheet closes the drawer. */
  toggleSidebar: () => void
  /** Bound ctx.sessions.refresh(): repull the baseline so a deleted row disappears. */
  refreshSessions: () => Promise<void>
  /** Bound ctx.sessions.clear(): drop the current selection when it was deleted. */
  clearSessions: () => void
}

/** Delete flow phases of the drawer action. */
type DeletePhase = 'idle' | 'confirm' | 'deleting'

/** One localizable delete error (null = no error). */
type DeleteError = string | null

/** Map a host error code onto drawer copy; unknown codes fall back to the raw message. */
function deleteErrorMessage(t: MobileDrawerFooterProps['t'], code: string | undefined, message: string): string {
  if (code === 'session-active') return t('deleteErrorSessionActive')
  if (code === 'session-not-found') return t('deleteErrorNotFound')
  return t('deleteErrorGeneric', { message })
}

/**
 * Mobile-only drawer footer actions, relocated from the session header to the
 * drawer footer (beside Settings):
 * - Files: opens the dsh-web-ui aionui explorer as a floating bottom sheet
 *   (the explorer column is hidden on mobile until this marker is set, so
 *   the suite's own persisted-expanded state can never cover the UI on load).
 * - Session log: the official session-log-export controller, so the
 *   progress/result dialog is shared with the desktop flow.
 * - Delete session: deletes the CURRENT session through the plugin's own
 *   host endpoint (`/api/mobile-nav.session.delete`). The harness exposes no
 *   session-delete API, so the node half removes the persisted log and
 *   detaches the workspace account; the browser then refreshes the list.
 *   A session that is live on the host (used since the last restart) is
 *   refused with an explanatory error instead.
 * Hidden entirely on wide screens (CSS media query).
 */
export function MobileDrawerFooter({
  useSessions, downloadSessionLog, toggleSidebar, refreshSessions, clearSessions, t,
}: MobileDrawerFooterProps) {
  const sessionId = useSessions((state) => state.current)
  const [phase, setPhase] = useState<DeletePhase>('idle')
  const [error, setError] = useState<DeleteError>(null)

  const openExplorer = (): void => {
    // Yield the preview sheet first (compat.css gives preview precedence
    // over explorer), then open the explorer and close the drawer.
    getFrame()?.removeAttribute('data-aionui-preview-open')
    getFrame()?.setAttribute('data-aionui-explorer-open', '')
    toggleSidebar()
  }

  const resetDelete = (): void => {
    setPhase('idle')
    setError(null)
  }

  const confirmDelete = async (): Promise<void> => {
    if (sessionId === undefined) return
    setPhase('deleting')
    setError(null)
    let response: Response
    try {
      response = await fetch('/api/mobile-nav.session.delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
    } catch (reason) {
      setError(t('deleteErrorGeneric', {
        message: reason instanceof Error ? reason.message : String(reason),
      }))
      setPhase('idle')
      return
    }
    const payload = await response.json().catch(() => null) as
      | { ok?: true; deleted?: string; error?: { code?: string; message?: string } }
      | null
    if (!response.ok || payload === null || payload.ok !== true) {
      const message = payload?.error?.message ?? `HTTP ${response.status}`
      setError(deleteErrorMessage(t, payload?.error?.code, message))
      setPhase('idle')
      return
    }
    // The deleted session was the one on stage: drop the selection before the
    // baseline refresh so the UI lands on the no-session empty state instead
    // of a conversation whose session no longer exists.
    if (payload.deleted === sessionId) clearSessions()
    await refreshSessions()
    resetDelete()
    toggleSidebar()
  }

  const disabled = sessionId === undefined || phase === 'deleting'
  return (
    <div data-mobile-nav="drawer-actions">
      <button
        type="button"
        data-mobile-nav="explorer"
        aria-label={t('files')}
        title={t('files')}
        onClick={openExplorer}
      >
        <IconPanelLeftOutline16 size={14} />
        <span>{t('files')}</span>
      </button>
      <button
        type="button"
        data-mobile-nav="session-log"
        aria-label={t('sessionLog')}
        title={t('sessionLog')}
        disabled={sessionId === undefined}
        onClick={() => {
          if (sessionId !== undefined) downloadSessionLog(sessionId)
        }}
      >
        <IconDownloadOutline16 size={14} />
        <span>{t('sessionLog')}</span>
      </button>
      {phase === 'confirm' || phase === 'deleting' ? (
        <div data-mobile-nav="delete-confirm">
          <div data-mobile-nav="delete-confirm-title">{t('deleteConfirmTitle')}</div>
          <div data-mobile-nav="delete-confirm-desc">{t('deleteConfirmDesc')}</div>
          <div data-mobile-nav="delete-confirm-actions">
            <button
              type="button"
              data-mobile-nav="delete-confirm-no"
              disabled={phase === 'deleting'}
              onClick={resetDelete}
            >
              {t('deleteConfirmNo')}
            </button>
            <button
              type="button"
              data-mobile-nav="delete-confirm-yes"
              disabled={phase === 'deleting'}
              onClick={() => { void confirmDelete() }}
            >
              {phase === 'deleting' ? t('deletePending') : t('deleteConfirmYes')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-mobile-nav="delete-session"
          aria-label={t('deleteSession')}
          title={t('deleteSession')}
          disabled={disabled}
          onClick={() => {
            setError(null)
            setPhase('confirm')
          }}
        >
          <IconTrashOutline16 size={14} />
          <span>{t('deleteSession')}</span>
        </button>
      )}
      {error !== null && (
        <div data-mobile-nav="delete-error" role="alert">{error}</div>
      )}
    </div>
  )
}
