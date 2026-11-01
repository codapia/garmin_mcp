import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ status: "ok", service: "fitness-web", data_mode: "demo" }, { headers: { "Cache-Control": "no-store" } });
}
