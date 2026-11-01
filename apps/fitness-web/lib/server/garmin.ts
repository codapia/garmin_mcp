import "server-only";

type RpcResponse={jsonrpc:string;id?:number;result?:{content?:{type?:string;text?:string}[];isError?:boolean};error?:{message:string}};
const endpoint=()=>process.env.GARMIN_MCP_URL;
const bearer=()=>process.env.GARMIN_MCP_HTTP_TOKEN;
export const garminConfigured=()=>Boolean(endpoint()&&bearer());

async function sendRpc(method:string,params:Record<string,unknown>,id:number):Promise<RpcResponse> {
  if(!endpoint()||!bearer())throw new Error("Garmin MCP aún no configurado");
  const response=await fetch(endpoint()!,{
    method:"POST",
    headers:{"Content-Type":"application/json","Accept":"application/json, text/event-stream","Authorization":"Bearer "+bearer()},
    body:JSON.stringify({jsonrpc:"2.0",id,method,params}),
    cache:"no-store",
    signal:AbortSignal.timeout(20000),
  });
  if(!response.ok)throw new Error("Garmin MCP HTTP "+response.status);
  const type=response.headers.get("content-type")||"";
  const raw=await response.text();
  if(raw.length>3_000_000)throw new Error("Respuesta Garmin demasiado grande");
  if(type.includes("text/event-stream")){
    const events=raw.split(/\r?\n\r?\n/);
    const frames=events.flatMap(event=>event.split(/\r?\n/).filter(line=>line.startsWith("data:")).map(line=>line.slice(5).trim()));
    for(const frame of frames.reverse()){try{const v=JSON.parse(frame) as RpcResponse;if(v.id===id)return v;}catch{}}
    throw new Error("MCP no devolvió respuesta JSON-RPC");
  }
  return JSON.parse(raw) as RpcResponse;
}
export async function callGarminTool(name:string,args:Record<string,unknown>):Promise<unknown> {
  // Never expose this function as an open tool-dispatch API to browsers.
  await sendRpc("initialize",{protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"fitness-codapia-backend",version:"0.1.0"}},1);
  const data=await sendRpc("tools/call",{name,arguments:args},2);
  if(data.error)throw new Error(data.error.message);
  if(!data.result||data.result.isError)throw new Error("Error al consultar Garmin: "+(data.result?.content?.[0]?.text||"respuesta vacía"));
  const parts=data.result.content||[];
  const first=parts.find(part=>part.type==="text")?.text||"";
  try{return JSON.parse(first)}catch{return {message:first}}
}
const formatDay=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date+"T12:00:00Z"));
export async function fetchGarminDay(date:string) {
  if(!formatDay(date))throw new Error("Fecha inválida");
  const operations=[
    ["daily_stats","get_stats",{date}],
    ["sleep","get_sleep_summary",{date}],
    ["hrv","get_hrv_data",{date}],
    ["readiness","get_training_readiness",{date}],
    ["activities","get_activities_by_date",{start_date:date,end_date:date,page_size:100}],
    ["scheduled_workouts","get_scheduled_workouts",{start_date:date,end_date:date}],
  ] as const;
  const outcome=await Promise.all(operations.map(async ([field,tool,args])=>{
    try {return {field,value:await callGarminTool(tool,args),error:null};}
    catch(e){return {field,value:null,error:field+": "+(e instanceof Error?e.message:String(e))};}
  }));
  const result:Record<string,unknown>={};
  const warnings:string[]=[];
  for(const r of outcome){result[r.field]=r.value;if(r.error)warnings.push(r.error);}
  if(outcome.every(x=>x.error))throw new Error("No se pudo obtener ninguna métrica de Garmin");
  return {...result,warnings};
}
