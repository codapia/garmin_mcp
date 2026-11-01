/**
 * Enforce the canonical browser origin rather than req.nextUrl.origin.
 * Behind Cloudflare Tunnel, Next.js can see the internal container address
 * while the browser legitimately sends https://fitness.codapia.cl.
 *
 * This endpoint handles a state-changing POST and requires Origin. The
 * machine-to-machine API has a separate route with Access + bearer auth.
 */
export function isAllowedBrowserOrigin(
  origin: string | null,
  allowedOrigin: string = process.env.FITNESS_PUBLIC_ORIGIN ?? "https://fitness.codapia.cl",
): boolean {
  return origin !== null && origin === allowedOrigin;
}
