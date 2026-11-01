import { NextRequest, NextResponse } from "next/server";
import { accessDenied } from "../../../../lib/server/access";
import { isAllowedBrowserOrigin } from "../../../../lib/server/origin";
import { sendPlanToGarmin } from "../../../../lib/server/plan-delivery";

export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
  const denied=await accessDenied(req);if(denied)return denied;
  if(!isAllowedBrowserOrigin(req.headers.get("origin")))
    return NextResponse.json({error:"Origen no permitido"},{status:403,headers:{"Cache-Control":"no-store"}});
  let payload:Record<string,unknown>;
  try{
    const body:unknown=await req.json();
    if(!body||typeof body!=="object"||Array.isArray(body))throw Error();
    payload=body as Record<string,unknown>;
  }catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
  try{
    const result=await sendPlanToGarmin(payload.plan_id as string,payload.expected_version as number);
    return NextResponse.json({ok:true,result},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:"No se pudo enviar a Garmin"},
      {status:422,headers:{"Cache-Control":"no-store"}});
  }
}
