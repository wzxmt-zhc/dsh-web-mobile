/**
 * dsh-mobile-nav, node half.
 *
 * The browser half ships via exports["./client"], discovered through the
 * package.json dsh.client declaration. This half stays deliberately minimal
 * but is no longer empty: it owns the ONE host capability the mobile drawer
 * needs that the harness does not provide — deleting a session.
 *
 * DSH currently offers no session-delete API anywhere (the session menu only
 * knows rename / fork / archive; `workspace.archiveSession` only hides a row),
 * so the plugin implements deletion itself:
 *
 * - `POST /api/mobile-nav.session.delete` receives `{ sessionId }`, removes
 *   the session's persisted artifact (the JSONL log under
 *   `$DSH_HOME/sessions/<cwd>/session.*`), and detaches the session from
 *   every workspace account. The session-query index prunes vanished
 *   sessions on its own reconciliation; the browser half refreshes its list.
 *
 * USED (live) sessions are deletable too: the host stops the session's agent
 * with a `disposed` cancel (public `Agent.cancel` / `Agent.whenIdle`), flushes
 * the durable checkpoint (`SessionStore.flush`), and then unregisters the live
 * session entry — and its agent — so the host stops listing the session
 * (there is no public teardown API; the runtime-visible store internals used
 * here mirror the agent-loop disposal sequence minus the scoped-world unwind,
 * and are optional-chained so a harness shape change degrades to a clear
 * error instead of a crash).
 *
 * Attachment bytes are content-addressed in a shared backend and are NOT
 * removed; they only become unreachable garbage once no log references them.
 */
import { rm } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionHeader, SessionId } from '@deepseek-ai/dsh-session'
// Type-only augmentation pulls: each package merges its service onto the
// cordis Context (webServer / sessionPersistence / workspaceRegistry /
// sessions / agents); nothing else is imported from them.
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-agent'

export const name = 'dsh-mobile-nav'

/** How long to wait for a live agent to converge to idle before refusing. */
const IDLE_TIMEOUT_MS = 20_000

/** Wire contract of the session-delete endpoint. */
interface DeleteSessionBody {
  sessionId?: unknown
}

/** Drain a request body as UTF-8 text. */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/** Find one session header by id. */
function findHeader(headers: readonly SessionHeader[], id: string): SessionHeader | undefined {
  return headers.find(candidate => candidate.id === id)
}

/** Bound a promise with a rejection deadline so a stuck agent never hangs the endpoint. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })
}

/** Write one JSON response with a fixed content type. */
function respond(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

/**
 * Register the session-delete route once the web route registry exists. The
 * persistence / session / workspace services are read at request time through
 * `ctx.get()` so the row fails with a clear error (never crashes) in host
 * shapes that omit them.
 * @param ctx - Host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: '/api/mobile-nav.session.delete',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          respond(res, 405, { error: { code: 'method-not-allowed', message: 'POST required' } })
          return
        }
        let body: DeleteSessionBody
        try {
          body = JSON.parse(await readBody(req)) as DeleteSessionBody
        } catch {
          respond(res, 400, {
            error: { code: 'invalid-body', message: 'expected a JSON body of the form { "sessionId": string }' },
          })
          return
        }
        const { sessionId } = body
        if (typeof sessionId !== 'string' || sessionId === '') {
          respond(res, 400, {
            error: { code: 'invalid-session-id', message: 'sessionId must be a non-empty string' },
          })
          return
        }

        const persistence = ctx.get('sessionPersistence')
        if (persistence === undefined) {
          respond(res, 503, {
            error: { code: 'persistence-unavailable', message: 'session persistence is not configured' },
          })
          return
        }
        let header: ReturnType<typeof findHeader>
        try {
          header = findHeader(await persistence.list(), sessionId)
        } catch (error) {
          // A storage fault must never leave the request hanging or pretend
          // the session is unknown: report it as a failure instead.
          ctx.logger.warn(`dsh-mobile-nav: session-delete listing failed: ${String(error)}`)
          respond(res, 500, {
            error: {
              code: 'delete-lookup-failed',
              message: `failed to look up the session: ${error instanceof Error ? error.message : String(error)}`,
            },
          })
          return
        }
        if (header === undefined) {
          respond(res, 404, {
            error: { code: 'session-not-found', message: `no such session '${sessionId}'` },
          })
          return
        }
        const sessions = ctx.get('sessions')
        const live = sessions?.get(sessionId as SessionId)
        if (live !== undefined && sessions !== undefined) {
          // Used (live) sessions are deletable: stop the driver, wait for
          // quiescence, flush the durable checkpoint, then unregister the
          // live entries so the host stops listing the session. Without the
          // unregister step the session would survive deletion inside
          // `ctx.sessions` and keep appearing in `session.list`.
          try {
            const agents = ctx.get('agents')
            const agent = agents?.get(sessionId as SessionId)
            if (agent !== undefined) {
              agent.cancel({ kind: 'disposed' })
              await withTimeout(
                agent.whenIdle(),
                IDLE_TIMEOUT_MS,
                `agent for session '${sessionId}' did not converge to idle within ${IDLE_TIMEOUT_MS}ms`,
              )
            }
            await sessions.flush(live)
            // Runtime-visible store internals (no public teardown API exists):
            // mirror the agent-loop disposal order — agent first, then session.
            const agentRegistry = agents as unknown as
              | { store?: Map<SessionId, unknown>; detachEntered?: (entry: unknown) => void }
              | undefined
            const agentEntry = agentRegistry?.store?.get(sessionId as SessionId)
            if (agentEntry !== undefined) agentRegistry?.detachEntered?.(agentEntry)
            const sessionStore = sessions as unknown as
              | { store?: Map<SessionId, { detach?: () => void }> }
              | undefined
            sessionStore?.store?.get(sessionId as SessionId)?.detach?.()
          } catch (error) {
            ctx.logger.warn(`dsh-mobile-nav: failed to stop live session '${sessionId}': ${String(error)}`)
            respond(res, 409, {
              error: {
                code: 'session-busy',
                message: `cannot delete session '${sessionId}': it is running and could not be stopped: ` +
                  `${error instanceof Error ? error.message : String(error)}`,
              },
            })
            return
          }
        }
        const located = persistence.locate(header)
        if (located === undefined || located.kind !== 'jsonl') {
          respond(res, 501, {
            error: {
              code: 'unsupported-persistence-backend',
              message: `cannot delete session '${sessionId}': persistence backend ` +
                `'${located?.kind ?? 'unknown'}' has no deletable per-session artifact`,
            },
          })
          return
        }
        try {
          await rm(located.path, { force: true })
        } catch (error) {
          ctx.logger.warn(`dsh-mobile-nav: failed to remove session artifact '${located.path}': ${String(error)}`)
          respond(res, 500, {
            error: {
              code: 'delete-failed',
              message: `failed to remove the session log: ${error instanceof Error ? error.message : String(error)}`,
            },
          })
          return
        }

        // Workspace accounting: remove the deleted session from every workspace
        // account (idempotent; unknown ids resolve without writing).
        const registry = ctx.get('workspaceRegistry')
        if (registry !== undefined) {
          for (const workspace of registry.list()) {
            await workspace.detachSession(sessionId as SessionId)
          }
        }
        respond(res, 200, { ok: true, deleted: sessionId })
      },
    }), 'dsh-mobile-nav: session-delete route')
  })
}
