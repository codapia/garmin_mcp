import { NextRequest, NextResponse } from "next/server";
import { accessDenied } from "../../../../lib/server/access";
import { getTimeline, validDay } from "../../../../lib/server/fitness";

export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
  const denied=await accessDenied(req);if(denied)return denied;
  const today=new Date().toISOString().slice(0,10);
  const start=req.nextUrl.searchParams.get("start") || today;
  const end=req.nextUrl.searchParams.get("end") || today;
  if(!validDay(start)||!validDay(end)||new Date(end).getTime()-new Date(start).getTime()>120*86400000)
    return NextResponse.json({error:"Rango de fechas inválido"},{status:400});
  try{return NextResponse.json({mode:"live",...(await getTimeline(start,end))},{headers:{"Cache-Control":"no-store"}});}
  catch{return NextResponse.json({error:"No se pudo consultar el historial"},{status:503});}
}
