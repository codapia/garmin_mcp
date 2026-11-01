"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, TrendingUp, Utensils } from "lucide-react";

export type Period="day"|"week";
export type MealRecord={
  id:string;date:string;meal_type:string;description:string;
  calories:number|null;protein_g:number|null;calories_estimated:boolean;protein_estimated:boolean;
};
export type MetricDay={
  date:string;daily_stats:Record<string,unknown>|null;sleep:Record<string,unknown>|null;
  hrv:Record<string,unknown>|null;readiness:unknown;activities:unknown;
};
const number=(x:unknown):number|null=>{
  if(typeof x==="number"&&Number.isFinite(x))return x;
  if(typeof x==="string"&&x.trim()!==""&&Number.isFinite(Number(x)))return Number(x);
  return null;
};
const record=(x:unknown):Record<string,unknown>=>x&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:{};
function field(obj:unknown,keys:string[]):number|null {
  const o=record(obj);
  for(const k of keys){const v=number(o[k]);if(v!==null)return v;}
  return null;
}
export function addDays(date:string,amount:number){
  const t=new Date(date+"T12:00:00Z");t.setUTCDate(t.getUTCDate()+amount);
  return t.toISOString().slice(0,10);
}
export function monday(date:string){
  const day=new Date(date+"T12:00:00Z").getUTCDay();
  return addDays(date,-((day+6)%7));
}
export function periodDates(date:string,period:Period){
  const start=period==="week"?monday(date):date;
  return Array.from({length:period==="week"?7:1},(_,i)=>addDays(start,i));
}
export function shortDate(date:string){
  return new Date(date+"T12:00:00Z").toLocaleDateString("es-CL",{day:"2-digit",month:"short"});
}
export function longDate(date:string){
  return new Date(date+"T12:00:00Z").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"});
}
export function DatePickerBar({date,period,onDate,onPeriod,availableDates}:{
  date:string;period:Period;onDate:(date:string)=>void;onPeriod:(period:Period)=>void;availableDates:string[];
}){
  const dates=periodDates(date,period),start=dates[0],end=dates[dates.length-1];
  const history=Array.from(new Set(availableDates.map(d=>period==="week"?monday(d):d))).sort().reverse().slice(0,12);
  function step(dir:number){onDate(addDays(date,dir*(period==="week"?7:1)));}
  return <div className="period-panel">
    <div className="period-header">
      <div className="period-switch" role="group" aria-label="Período de consulta">
        <button type="button" className={period==="day"?"active":""} aria-pressed={period==="day"} onClick={()=>onPeriod("day")}>Día</button>
        <button type="button" className={period==="week"?"active":""} aria-pressed={period==="week"} onClick={()=>onPeriod("week")}>Semana</button>
      </div>
      <div className="period-nav">
        <button type="button" onClick={()=>step(-1)} aria-label="Período anterior"><ChevronLeft size={18}/></button>
        <span><CalendarDays size={17}/>{period==="day"?longDate(date):shortDate(start)+" — "+shortDate(end)}</span>
        <button type="button" onClick={()=>step(1)} aria-label="Período siguiente"><ChevronRight size={18}/></button>
      </div>
    </div>
    <div className="period-shortcuts" aria-label="Fechas con registros">
      {history.map(d=><button key={d} type="button" className={(period==="week"?monday(date):date)===d?"selected":""}
        onClick={()=>onDate(d)}>{period==="week"?"Semana "+shortDate(d):shortDate(d)}</button>)}
    </div>
  </div>;
}
const slots=[
  {id:"morning",title:"Mañana",subtitle:"Desayuno"},
  {id:"noon",title:"Mediodía",subtitle:"Almuerzo"},
  {id:"night",title:"Noche",subtitle:"Cena"},
  {id:"unknown",title:"Colaciones y otros",subtitle:"Horario no informado"}
] as const;
function mealSlot(type:string){
  if(type==="desayuno")return "morning";
  if(type==="almuerzo")return "noon";
  if(type==="cena")return "night";
  return "unknown";
}
const val=(n:number|null,dec=0)=>n===null?"Sin estimar":n.toLocaleString("es-CL",{maximumFractionDigits:dec});
export function MealGroups({meals,dates,emptyMessage="Sin comidas registradas en este período."}:{
  meals:MealRecord[];dates:string[];emptyMessage?:string;
}){
  const sections=dates.slice().reverse().map(date=>({date,items:meals.filter(m=>m.date===date)}));
  const hasFood=sections.some(s=>s.items.length);
  if(!hasFood)return <div className="panel"><p className="muted">{emptyMessage}</p></div>;
  return <div className="meal-timeline">{sections.filter(s=>s.items.length).map(section=><section key={section.date} className="meal-date-panel panel">
    <div className="meal-day-heading"><h2><Utensils size={20}/>{longDate(section.date)}</h2>
      <span>{section.items.length} registros</span>
    </div>
    <div className="meal-slots">
      {slots.map(slot=>{
        const items=section.items.filter(m=>mealSlot(m.meal_type)===slot.id);
        return <div className="meal-slot" key={slot.id}>
          <div className="meal-slot-heading"><h3>{slot.title}</h3><span>{slot.subtitle}</span></div>
          {items.length?items.map(m=><article key={m.id} className="meal-entry">
            <p>{m.description}</p>
            <div className="meal-values">
              <span>{val(m.calories,1)}{m.calories===null?"":" kcal"}{m.calories!==null&&m.calories_estimated?" · estimado":""}</span>
              <span>{val(m.protein_g,1)}{m.protein_g===null?" proteína":" g proteína"}{m.protein_g!==null&&m.protein_estimated?" · estimado":""}</span>
            </div>
          </article>):<p className="muted meal-empty">Sin registro</p>}
        </div>;
      })}
    </div>
    <p className="muted meal-day-note">Las colaciones se muestran aparte cuando no se conoce la hora. Un registro vacío no significa que no hayas comido.</p>
  </section>)}</div>;
}
type MetricId="sleep"|"sleepScore"|"battery"|"batteryCurrent"|"readiness"|"hrv"|"restHr"|"stress"|"steps"|"activeKcal"|"trainingMin"|"calories"|"protein";
const COLORS=["#b8ff17","#61d8ff","#d68cff","#ffbf69","#ff7cae","#82efb8"];
const METRICS:{id:MetricId;title:string;unit:string;group:string}[]=[
  {id:"sleep",title:"Sueño",unit:"h",group:"Recuperación"},
  {id:"sleepScore",title:"Puntuación de sueño",unit:"/100",group:"Recuperación"},
  {id:"battery",title:"Body Battery máximo",unit:"/100",group:"Recuperación"},
  {id:"batteryCurrent",title:"Body Battery última lectura",unit:"/100",group:"Recuperación"},
  {id:"readiness",title:"Disposición para entrenar",unit:"/100",group:"Recuperación"},
  {id:"hrv",title:"VFC nocturna",unit:"ms",group:"Recuperación"},
  {id:"restHr",title:"FC en reposo",unit:"lpm",group:"Salud"},
  {id:"stress",title:"Estrés medio",unit:"/100",group:"Salud"},
  {id:"steps",title:"Pasos",unit:"pasos",group:"Actividad"},
  {id:"activeKcal",title:"Gasto activo",unit:"kcal",group:"Actividad"},
  {id:"trainingMin",title:"Entrenamiento",unit:"min",group:"Actividad"},
  {id:"calories",title:"Ingesta registrada",unit:"kcal",group:"Alimentación"},
  {id:"protein",title:"Proteína registrada",unit:"g",group:"Alimentación"}
];
function readinessScore(input:unknown):number|null{
  if(Array.isArray(input)){
    const scores=input.map(x=>field(x,["score","trainingReadiness"])).filter((v):v is number=>v!==null);
    return scores.length?scores[0]:null;
  }
  return field(input,["score","training_readiness","trainingReadiness"]);
}
function activityMinutes(input:unknown):number|null{
  const value=Array.isArray(input)?input:record(input).activities;
  if(!Array.isArray(value))return null;
  return value.reduce<number>((sum,item)=>{
    const n=field(item,["duration_seconds","durationSeconds","duration"]);
    return sum+(n===null?0:n/60);
  },0);
}
function metricValue(id:MetricId,date:string,day:MetricDay|undefined,meals:MealRecord[]):number|null {
  const d=day?.daily_stats,s=day?.sleep,h=day?.hrv;
  switch(id){
    case "sleep":return field(s,["sleep_hours","sleepHours"]);
    case "sleepScore":return field(s,["sleep_score","sleepScore"]);
    case "battery":return field(d,["body_battery_highest","bodyBatteryHighest"]);
    case "batteryCurrent":return field(d,["body_battery_current","bodyBatteryCurrent"]);
    case "readiness":return readinessScore(day?.readiness);
    case "hrv":return field(s,["avg_overnight_hrv"])??field(h,["last_night_avg_hrv_ms","lastNightAvg"]);
    case "restHr":return field(d,["resting_heart_rate_bpm","restingHeartRate"]);
    case "stress":return field(d,["avg_stress_level","averageStressLevel"]);
    case "steps":return field(d,["total_steps","totalSteps"]);
    case "activeKcal":return field(d,["active_calories","activeKilocalories"]);
    case "trainingMin":return day?activityMinutes(day.activities):null;
    case "calories":case "protein": {
      const subset=meals.filter(m=>m.date===date).map(m=>id==="calories"?number(m.calories):number(m.protein_g)).filter((v):v is number=>v!==null);
      return subset.length?subset.reduce((a,b)=>a+b,0):null;
    }
  }
}
export function TrendExplorer({days,meals,date}:{
  days:MetricDay[];meals:MealRecord[];date:string;
}){
  const [windowDays,setWindowDays]=useState<7|30|90>(30);
  const [selected,setSelected]=useState<MetricId[]>(["battery","sleep","hrv"]);
  const dates=useMemo(()=>Array.from({length:windowDays},(_,i)=>addDays(date,i-(windowDays-1))),[date,windowDays]);
  const byDate=useMemo(()=>new Map(days.map(d=>[d.date,d])),[days]);
  const series=useMemo(()=>selected.map((id,i)=>{
    const cfg=METRICS.find(m=>m.id===id)!;
    const values=dates.map(d=>metricValue(id,d,byDate.get(d),meals));
    const available=values.filter((n):n is number=>n!==null);
    const low=available.length?Math.min(...available):null;
    const high=available.length?Math.max(...available):null;
    const span=low!==null&&high!==null?Math.max(high-low,Math.max(1,Math.abs(high))*0.08):1;
    return {...cfg,color:COLORS[i%COLORS.length],values,low,high,span};
  }),[selected,dates,byDate,meals]);
  const width=100+windowDays*84,height=382,left=70,top=50,base=315;
  function toggle(id:MetricId){
    setSelected(old=>old.includes(id)?old.filter(v=>v!==id):old.length>=4?old:[...old,id]);
  }
  const hasRecords=series.some(s=>s.low!==null);
  const pointY=(n:number,s:(typeof series)[number])=>base-((n-(s.low??0))/s.span)*220-16;
  return <section className="panel trend-explorer">
    <div className="insight-heading"><div><span className="eyebrow">EVOLUCIÓN EN EL TIEMPO</span><h2><TrendingUp size={21}/> Comparador de indicadores</h2>
      <p className="muted">Selecciona hasta 4 métricas y compáralas sobre los mismos días.</p></div>
      <div className="period-switch" role="group" aria-label="Días en la gráfica">
        {([7,30,90] as const).map(v=><button type="button" key={v} className={windowDays===v?"active":""} aria-pressed={windowDays===v} onClick={()=>setWindowDays(v)}>{v} días</button>)}
      </div>
    </div>
    <div className="trend-layout">
      <aside className="trend-sidebar" aria-label="Seleccionar indicadores">
        {["Recuperación","Salud","Actividad","Alimentación"].map(group=><div key={group}>
          <h3>{group}</h3>{METRICS.filter(m=>m.group===group).map(m=>{
            const index=selected.indexOf(m.id);
            const current=series.find(s=>s.id===m.id);
            return <button key={m.id} type="button" aria-pressed={index>=0} className={"trend-metric "+(index>=0?"on":"")}
              onClick={()=>toggle(m.id)} title={index<0&&selected.length>=4?"Quita una métrica para añadir otra":m.title}>
              <span className="trend-swatch" style={{background:index>=0?COLORS[index%COLORS.length]:"transparent",borderColor:index>=0?COLORS[index%COLORS.length]:"#5c695e"}}/>
              <span>{m.title}<small>{current?.low!==null&&current?.low!==undefined?val(current.low,1)+"–"+val(current.high,1)+" "+m.unit:m.unit}</small></span>
            </button>;
          })}</div>)}
        <p className="muted">Los indicadores sin mediciones se omiten de la gráfica. Quita uno para elegir otro.</p>
      </aside>
      <div className="trend-main">
        <div className="trend-legend">{series.map(s=><span key={s.id} style={{color:s.color}}><i style={{background:s.color}}/>{s.title} ({s.unit})</span>)}</div>
        {!hasRecords?<div className="trend-no-data">No hay registros de las métricas seleccionadas dentro de este período.</div>:
        <div className="trend-scroll" role="region" tabIndex={0} aria-label="Gráfica horizontal desplazable con fechas, métricas y valores">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={"Evolución de "+series.map(s=>s.title).join(", ")}>
            {Array.from({length:5},(_,i)=>{const y=base-i*55;return <g key={i}>
              <line x1={left} x2={width-20} y1={y} y2={y} stroke="#354538" strokeDasharray={i?"4 6":"0"}/>
              <text x={left-12} y={y+4} textAnchor="end" fill="#a3b3a0" fontSize="11">{i*25}%</text>
            </g>;})}
            {dates.map((d,i)=>{const x=left+40+i*84;return <g key={d}>
              <line x1={x} x2={x} y1={top} y2={base} stroke="#344435" opacity=".30"/>
              <text x={x} y={base+26} textAnchor="middle" fill="#c3d1be" fontSize="12">{shortDate(d)}</text>
              <text x={x} y={base+42} textAnchor="middle" fill="#7d917d" fontSize="10">{new Date(d+"T12:00:00Z").toLocaleDateString("es-CL",{weekday:"short"})}</text>
            </g>;})}
            {series.map((s,si)=>{
              if(s.low===null)return null;
              let path="",start=true;
              s.values.forEach((n,i)=>{if(n===null){start=true;return;}const x=left+40+i*84,y=pointY(n,s);path+=(start?"M":"L")+x+" "+y+" ";start=false;});
              return <g key={s.id}>
                <path d={path} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
                {s.values.map((n,i)=>n!==null&&<g key={i}>
                  <circle cx={left+40+i*84} cy={pointY(n,s)} r="5" fill={s.color} stroke="#0d140d" strokeWidth="2">
                    <title>{dates[i]} · {s.title}: {val(n,1)} {s.unit}</title>
                  </circle>
                  <text x={left+40+i*84} y={Math.max(16,pointY(n,s)-11-((si%2)*13))}
                    textAnchor="middle" fill={s.color} fontSize="12" fontWeight="700"
                    stroke="#0b120c" strokeWidth="3" paintOrder="stroke">{val(n,1)}</text>
                </g>)}
              </g>;
            })}
          </svg>
        </div>}
        <p className="muted trend-footnote">Eje horizontal: días. Eje vertical: escala relativa de cada serie (0–100 % de su rango observado), no unidades compartidas. Las cifras sobre los puntos y las escalas de la izquierda conservan las unidades reales. Huecos = datos faltantes; no equivalen a cero. Body Battery «última lectura» puede ser parcial.</p>
      </div>
    </div>
  </section>;
}
