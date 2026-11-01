import { NextRequest, NextResponse } from "next/server";
import { accessDenied } from "../../../../lib/server/access";
import { storeGarminDay, validDay } from "../../../../lib/server/fitness";

export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
  const denied=await accessDenied(req);if(denied)return denied;
  const origin=req.headers.get("origin");
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origen no permitido"},{status:403});
  let body:Record<string,unknown>={};
  try{body=await req.json();}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
  if(!validDay(body.date))return NextResponse.json({error:"Fecha inválida"},{status:400});
  try{return NextResponse.json({ok:true,result:await storeGarminDay(body.date)},{headers:{"Cache-Control":"no-store"}});}
  catch(e){return NextResponse.json({error:e instanceof Error?e.message:"No se pudo sincronizar Garmin"},{status:502});}
}
