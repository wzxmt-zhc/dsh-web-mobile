import type { Context } from '@deepseek-ai/cordis';
export declare const name = "dsh-mobile-nav";
/**
 * Register the session-delete route once the web route registry exists. The
 * persistence / session / workspace services are read at request time through
 * `ctx.get()` so the row fails with a clear error (never crashes) in host
 * shapes that omit them.
 * @param ctx - Host plugin context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map