import { NextRequest, NextResponse } from "next/server";
import { verifyAccess } from "./lib/server/access";

// Defense in depth in addition to Cloudflare Access at the edge.
export async function proxy(req: NextRequest) {
  if (await verifyAccess(req)) return NextResponse.next();
  return NextResponse.json({error:"Acceso no autorizado. Inicia sesión mediante Cloudflare Access."},
    {status:401,headers:{"Cache-Control":"no-store"}});
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|manifest.webmanifest|api/health).*)"],
};
