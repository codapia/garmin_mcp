import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export function equalSecrets(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const a=Buffer.from(received), b=Buffer.from(expected);
  return a.length===b.length && timingSafeEqual(a,b);
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | undefined;
export async function verifyAccess(request: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV!=="production" && process.env.FITNESS_DEV_AUTH_BYPASS==="true") return true;
  const domain=process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud=process.env.CF_ACCESS_AUD;
  if (!domain || !aud || !/^[a-zA-Z0-9-]+\.cloudflareaccess\.com$/.test(domain)) return false;
  const token=request.headers.get("cf-access-jwt-assertion");
  if (!token) return false;
  try {
    cachedJwks ??= createRemoteJWKSet(new URL("https://"+domain+"/cdn-cgi/access/certs"));
    await jwtVerify(token,cachedJwks,{issuer:"https://"+domain,audience:aud});
    return true;
  } catch { return false; }
}
export async function accessDenied(request: NextRequest): Promise<NextResponse | null> {
  if(await verifyAccess(request)) return null;
  return NextResponse.json({error:"Acceso no autorizado"},{status:401,headers:{"Cache-Control":"no-store"}});
}
export function internalDenied(request: NextRequest): NextResponse | null {
  const bearer=request.headers.get("authorization");
  const token=bearer?.startsWith("Bearer ")?bearer.slice(7):null;
  return equalSecrets(token,process.env.FITNESS_INTERNAL_TOKEN)?null:
    NextResponse.json({error:"Credencial interna inválida"},{status:401,headers:{"Cache-Control":"no-store"}});
}
