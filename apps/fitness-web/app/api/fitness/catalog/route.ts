import { NextRequest, NextResponse } from "next/server";
import { accessDenied } from "../../../../lib/server/access";
import { callGarminTool } from "../../../../lib/server/garmin";

export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
  const denied=await accessDenied(req);if(denied)return denied;
  const p=req.nextUrl.searchParams;
  const query=(p.get("query")||"").slice(0,80);
  const category=(p.get("category")||"").slice(0,80);
  const muscle=(p.get("muscle")||"").slice(0,80);
  const equipment=(p.get("equipment")||"").slice(0,80);
  const limit=Math.max(1,Math.min(100,Number(p.get("limit"))||40));
  try {const result=await callGarminTool("search_exercises",{query,category,muscle,equipment,limit});
    return NextResponse.json(result,{headers:{"Cache-Control":"private, max-age=120"}});
  }catch{return NextResponse.json({error:"No se pudo consultar el catálogo de Garmin"},{status:502});}
}
