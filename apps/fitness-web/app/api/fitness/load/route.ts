import { NextRequest, NextResponse } from "next/server";
import { accessDenied } from "../../../../lib/server/access";
import { isAllowedBrowserOrigin } from "../../../../lib/server/origin";
import { saveExerciseLoad } from "../../../../lib/server/fitness";

export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
  const denied=await accessDenied(req);if(denied)return denied;
  if(!isAllowedBrowserOrigin(req.headers.get("origin")))
    return NextResponse.json({ok:false,error:"Origen no permitido"},{status:403,headers:{"Cache-Control":"no-store"}});
  let payload:unknown;
  try{payload=await req.json();}
  catch{return NextResponse.json({ok:false,error:"JSON inválido"},{status:400});}
  try{
    const result=await saveExerciseLoad(payload);
    return NextResponse.json({ok:true,result},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:"No se pudo guardar el peso"},
      {status:422,headers:{"Cache-Control":"no-store"}});
  }
}
