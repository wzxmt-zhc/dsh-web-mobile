/**
 * Session-row action-menu injection: on mobile, adds a "delete session" item
 * to the host's per-row ⋯ menu (beside rename / fork / archive) and drives
 * the whole delete flow: row → session id resolution, a confirm dialog, the
 * host delete endpoint, and the list refresh.
 *
 * The host menu is React-owned (ui-workspace) with no extension slot, so the
 * item is injected into the portaled `[role="menu"]` list by cloning the
 * host's own item markup (reusing the hashed classes keeps the styling
 * identical), and re-injected whenever React recreates the menu.
 *
 * Row → session id: session rows carry no id in the DOM, so the session is
 * resolved from the client list by display title (the row's rendered title IS
 * the summary's `displayTitle`); duplicate titles are disambiguated by the
 * row's position within its workspace group section.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Install the mobile session-delete menu machinery. Mobile-only: the whole
 * effect arms under the ≤1023px breakpoint and is a complete no-op on
 * desktop. Returns a disposer (via installMobileEffect) that removes every
 * listener, observer, injected node, and the confirm dialog.
 * @param ctx - client root context.
 */
export declare function installSessionMenuDelete(ctx: ClientContext): void;
//# sourceMappingURL=session-menu.d.ts.map