import { NextRequest, NextResponse } from "next/server";
import { accessDenied, internalDenied } from "../../../../lib/server/access";
import { saveMeal, listMeals, savePlan, listPlans, storeGarminDay, getTimeline, validDay } from "../../../../lib/server/fitness";

export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
  const a=await accessDenied(req);if(a)return a;
  const b=internalDenied(req);if(b)return b;
  let body:Record<string,unknown>;
  try{body=await req.json();if(!body||typeof body!=="object"||Array.isArray(body))throw Error();}
  catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
  try {
    let data:unknown;
    const start=body.start,end=body.end;
    if(["list_meals","list_plans","timeline"].includes(String(body.action))){
      if(!validDay(start)||!validDay(end)||new Date(end).getTime()-new Date(start).getTime()>120*86400000)
        return NextResponse.json({error:"Fechas inválidas o rango mayor a 120 días"},{status:400});
    }
    switch(body.action){
      case "save_meal": data=await saveMeal(body.payload);break;
      case "list_meals": data=await listMeals(start as string,end as string);break;
      case "save_plan": data=await savePlan(body.payload);break;
      case "list_plans": data=await listPlans(start as string,end as string);break;
      case "timeline": data=await getTimeline(start as string,end as string);break;
      case "sync_garmin": if(!validDay(body.date))throw Error("Fecha inválida");data=await storeGarminDay(body.date);break;
      default:return NextResponse.json({error:"Acción no permitida"},{status:400});
    }
    return NextResponse.json({ok:true,data},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:"Error de operación"},{status:400});}
}
