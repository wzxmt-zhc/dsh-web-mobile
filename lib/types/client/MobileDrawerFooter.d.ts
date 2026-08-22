import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** Full props for the sidebar footer action entry. */
export interface MobileDrawerFooterProps extends PropsRuntime<'sidebar.footer.action'>, PropsLocale<typeof NS> {
    /** Bound ctx.sessionLogDownload.download() for the current session. */
    downloadSessionLog: (sessionId: string) => void;
    /** Bound ctx.layout.toggleSidebar(): the Files sheet closes the drawer. */
    toggleSidebar: () => void;
    /** Bound ctx.sessions.refresh(): repull the baseline so a deleted row disappears. */
    refreshSessions: () => Promise<void>;
    /** Bound ctx.sessions.clear(): drop the current selection when it was deleted. */
    clearSessions: () => void;
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
export declare function MobileDrawerFooter({ useSessions, downloadSessionLog, toggleSidebar, refreshSessions, clearSessions, t, }: MobileDrawerFooterProps): import("react").JSX.Element;
//# sourceMappingURL=MobileDrawerFooter.d.ts.map