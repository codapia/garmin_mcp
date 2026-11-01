"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, Dumbbell, HeartPulse, Moon, RefreshCcw, Search, Utensils, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { DatePickerBar, MealGroups, MealWeekGrid, TrendExplorer, periodDates, longDate, type Period } from "./fitness-insights";
import { ExerciseDemo } from "./exercise-demo";

type Tab="home"|"workout"|"food"|"history"|"progress"|"catalog";
type Day={
  date:string;daily_stats:Record<string,unknown>|null;sleep:Record<string,unknown>|null;
  hrv:Record<string,unknown>|null;readiness:unknown;activities:unknown;scheduled_workouts:unknown;
  sync_warnings:string[];synced_at:string;
};
type Meal={id:string;date:string;meal_type:string;description:string;calories:number|null;protein_g:number|null;calories_estimated:boolean;protein_estimated:boolean;portions:unknown;notes?:string};
type Plan={id:string;date:string;title:string;steps:Record<string,unknown>[];version:number;garmin_workout_id:string|null};
type Timeline={mode:"live";days:Day[];meals:Meal[];plans:Plan[]};
type CatalogExercise={category:string;exercise_name:string;name_en:string;name_es:string|null;primary_muscles:string[];equipment:string[]};
const getNum=(v:unknown):number|null=>typeof v==="number"&&Number.isFinite(v)?v:null;
const getObj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const fmt=(v:number|null,dec=0)=>v===null?"—":v.toLocaleString("es-CL",{maximumFractionDigits:dec});
const value=(v:unknown)=>v==null||v===""?"—":String(v);
const dateLabel=(date:string)=>new Date(date+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"});
export function chileDay():string{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const part=(name:string)=>parts.find(p=>p.type===name)?.value||"";
  return part("year")+"-"+part("month")+"-"+part("day");
}
function offsetDay(days:number):string{
  const t=new Date(chileDay()+"T12:00:00Z");t.setUTCDate(t.getUTCDate()+days);
  return t.toISOString().slice(0,10);
}
function dataNum(obj:unknown,keys:string[]):number|null{
  const v=getObj(obj);
  for(const key of keys){const n=getNum(v[key]);if(n!==null)return n;}
  return null;
}
function metric(day:Day|undefined,name:string):number|null{
  if(!day)return null;
  const d=day.daily_stats,s=day.sleep,h=day.hrv;
  const term=name.toLowerCase();
  if(term.includes("sueño"))return dataNum(s,["sleep_hours","sleepHours","sleep_score"]);
  if(term.includes("pasos"))return dataNum(d,["total_steps","totalSteps"]);
  if(term.includes("battery")||term.includes("energía"))return dataNum(d,["body_battery_current","bodyBatteryCurrent","body_battery_highest"]);
  if(term.includes("estrés"))return dataNum(d,["avg_stress_level","averageStressLevel"]);
  if(term.includes("vfc"))return dataNum(s,["avg_overnight_hrv"])??dataNum(h,["lastNightAvg","weeklyAvg"]);
  if(term.includes("proteína"))return null;
  if(term.includes("ingesta"))return null;
  if(term.includes("reposo")||term.includes("fc"))return dataNum(d,["resting_heart_rate_bpm","restingHeartRate"]);
  if(term.includes("calorías")||term.includes("gasto"))return dataNum(d,["active_calories","activeKilocalories"]);
  return null;
}
function Line({numbers}:{numbers:(number|null)[]}){
  const valid=numbers.filter((x):x is number=>x!==null);
  if(valid.length<2)return <p className="muted">Aún faltan mediciones suficientes para comparar este indicador.</p>;
  const lo=Math.min(...valid),span=Math.max(1,Math.max(...valid)-lo);
  const points=numbers.map((n,i)=>n===null?null:[20+i*660/Math.max(1,numbers.length-1),165-(n-lo)/span*120]);
  let path="",move=true;
  for(const p of points){if(!p){move=true;continue;}path+=(move?"M":"L")+p[0].toFixed(1)+" "+p[1].toFixed(1)+" ";move=false;}
  return <svg className="line-chart" viewBox="0 0 700 205" role="img" aria-label="Tendencia de métricas sincronizadas">
    <path d="M20 50H680M20 110H680M20 165H680" stroke="#344234" strokeWidth="1" fill="none"/>
    <path d={path} stroke="#b8ff17" strokeWidth="4" fill="none" strokeLinecap="round"/>
    {points.map((p,i)=>p&&<circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#b8ff17"/>)}
    <text x="20" y="194" fontSize="13" fill="#9eae9c">Inicio</text><text x="680" y="194" fontSize="13" fill="#9eae9c" textAnchor="end">Último</text>
  </svg>;
}
function Kpi({label,number,unit=""}:{label:string;number:number|null;unit?:string}) {
  return <div className="metric panel"><div className="metric-head"><Activity size={17}/><span>{label}</span></div><strong>{fmt(number,1)}<small> {unit}</small></strong><span className="metric-foot">Garmin sincronizado</span></div>;
}
export default function LivePortal({tab}:{tab:Tab}){
  const [data,setData]=useState<Timeline|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [syncing,setSyncing]=useState(false);
  const [sendingPlan,setSendingPlan]=useState<string|null>(null);
  const [sendMessage,setSendMessage]=useState("");
  const [date,setDate]=useState(chileDay);
  const [period,setPeriod]=useState<Period>("week");
  const [detail,setDetail]=useState("Resumen");
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("");
  const [muscle,setMuscle]=useState("");
  const [equipment,setEquipment]=useState("");
  const [catalog,setCatalog]=useState<CatalogExercise[]>([]);
  const [total,setTotal]=useState(0);
  const [catalogError,setCatalogError]=useState("");
  async function load(){
    setLoading(true);
    try{
      const r=await fetch("/api/fitness/timeline?start="+offsetDay(-89)+"&end="+offsetDay(30),{cache:"no-store"});
      const obj=await r.json();if(!r.ok)throw Error(obj.error||"Servicio no disponible");
      setData(obj);setError("");
    }catch(e){setError(e instanceof Error?e.message:"Error de carga");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  useEffect(()=>{
    if(tab!=="catalog")return;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      try{
        const p=new URLSearchParams({query,category,muscle,equipment,limit:"60"});
        const response=await fetch("/api/fitness/catalog?"+p.toString(),{signal:controller.signal});
        const result=await response.json();if(!response.ok)throw Error(result.error||"No disponible");
        setCatalog(result.exercises||[]);setTotal(result.total_matches??0);setCatalogError("");
      }catch(e){if(!controller.signal.aborted)setCatalogError(e instanceof Error?e.message:"Error");}
    },280);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[tab,query,category,muscle,equipment]);
  const byDay=useMemo(()=>new Map((data?.days||[]).map(d=>[d.date,d])),[data]);
  const chosen=byDay.get(date);
  const activeDates=periodDates(date,period);
  const activeSet=new Set(activeDates);
  const todaysPlans=(data?.plans||[]).filter(p=>activeSet.has(p.date));
  const todaysMeals=(data?.meals||[]).filter(m=>activeSet.has(m.date));
  const allDates=Array.from(new Set([...(data?.days||[]).map(d=>d.date),...(data?.meals||[]).map(m=>m.date),...(data?.plans||[]).map(p=>p.date)])).sort().reverse();
  const days=data?.days||[];
  const periodCaption=period==="day"?"Día "+longDate(date):"Semana "+longDate(activeDates[0])+" al "+longDate(activeDates[6]);
  const imported=(p:Plan)=>p.steps.some(step=>Boolean(step.source_garmin_workout_id));
  const alreadyInGarmin=(p:Plan)=>Boolean(p.garmin_workout_id)||imported(p);
  const canSend=(p:Plan)=>!alreadyInGarmin(p)&&p.steps.every(step=>Boolean(step.category&&step.exercise_name&&step.sets&&step.reps));
  async function sync(){
    setSyncing(true);
    try{
      const r=await fetch("/api/fitness/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date})});
      const result=await r.json();if(!r.ok)throw Error(result.error||"Sincronización fallida");
      await load();setError("");
    }catch(e){setError(e instanceof Error?e.message:"Error de Garmin");}
    finally{setSyncing(false);}
  }
  async function sendToGarmin(plan:Plan){
    setSendingPlan(plan.id);setSendMessage("");
    try{
      const r=await fetch("/api/fitness/send",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({plan_id:plan.id,expected_version:plan.version})
      });
      const reply=await r.json();
      if(!r.ok||!reply.ok)throw Error(reply.error||"No se pudo enviar la rutina");
      setSendMessage("Rutina programada para "+reply.result.scheduled_date+". Sincroniza Garmin Connect con tu reloj.");
      await load();
    }catch(e){setSendMessage(e instanceof Error?e.message:"Error al enviar rutina");}
    finally{setSendingPlan(null);}
  }
  if(loading&&!data)return <div className="panel"><p>Consultando historial privado…</p></div>;
  if(error&&!data)return <div className="panel"><h2>Error de conexión</h2><p>{error}</p><button className="neon-button" onClick={load}>Reintentar</button></div>;
  return <div className="live-content">
    <div className="intro"><span className="eyebrow">DATOS PERSISTENTES · FITNESS CODAPIA</span><h1>{{home:"Tu día",workout:"Rutina completa",food:"Alimentación",history:"Histórico diario",progress:"Progreso cruzado",catalog:"Catálogo Garmin"}[tab]}<span className="neon-dot">.</span></h1>
      <p>Garmin es la fuente de las actividades realizadas. Las comidas y los planes se almacenan en tu propia base de datos.</p>
    </div>
    {error&&<div className="demo-banner"><AlertTriangle size={17}/>{error}</div>}
    {tab!=="catalog"&&<>
      <div className="live-toolbar panel">
        <div className="toolbar-top"><label>Fecha de referencia <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          <button className="neon-button" disabled={syncing} onClick={sync}><RefreshCcw size={17} className={syncing?"spin":""}/>{syncing?"Sincronizando…":"Actualizar Garmin (día)"}</button></div>
        <span className="muted">Última lectura del día seleccionado: {chosen?new Date(chosen.synced_at).toLocaleString("es-CL"):"Sin sincronizar"}.</span>
      </div>
      {tab!=="progress"&&<DatePickerBar date={date} period={period} onDate={setDate} onPeriod={setPeriod} availableDates={allDates}/>}
    </>}
    {(chosen?.sync_warnings?.length ?? 0)>0&&<div className="demo-banner"><AlertTriangle size={17}/>Se conservaron los datos disponibles. Algunas métricas no respondieron: {chosen?.sync_warnings?.join("; ")}</div>}
    {tab==="home"&&<>
      <p className="muted">{periodCaption} · Los indicadores Garmin de esta sección corresponden al día de referencia.</p>
      <div className="metric-grid">
        <Kpi label="Pasos" number={metric(chosen,"pasos")}/>
        <Kpi label="Body Battery" number={metric(chosen,"battery")} unit="/100"/>
        <Kpi label="Sueño" number={metric(chosen,"sueño")} unit="h"/>
        <Kpi label="Estrés medio" number={metric(chosen,"estrés")}/>
      </div>
      <div className="home-grid">
        <div className="panel"><h2><Dumbbell size={19}/> Rutinas programadas</h2>{todaysPlans.length?todaysPlans.map(p=><p key={p.id}>{longDate(p.date)} · {p.title} · {p.steps.length} ejercicios · {alreadyInGarmin(p)?"Existe en Garmin":"Solo en Fitness"}</p>):<p className="muted">No hay rutina guardada en Fitness para este día. Se podrá registrar desde ChatGPT.</p>}</div>
        <div className="panel"><h2><Utensils size={19}/> Alimentación</h2><p>{todaysMeals.length} comidas registradas en {period==="week"?"la semana":"el día"}.</p><p className="muted">Los totales solo cuentan alimentos con estimación registrada; un día incompleto no es un consumo de 0 kcal.</p></div>
      </div>
    </>}
    {tab==="workout"&&<>
      <p className="muted">{periodCaption}</p>
      {!todaysPlans.length&&<div className="panel"><p>Sin rutina web guardada para este día. Puedes pedirme por ChatGPT que cree una y la guarde aquí. La programación en Garmin es un paso separado.</p></div>}
      {sendMessage&&<div className="panel" role="status"><p>{sendMessage}</p></div>}
      {todaysPlans.map(p=><div className="panel" key={p.id}>
        <div className="panel-heading"><h2><Dumbbell size={19}/> {p.title}</h2></div>
        <p className="muted">{longDate(p.date)} · {p.steps.length} pasos · {alreadyInGarmin(p)?"Rutina existente en Garmin":"Guardada solamente en Fitness"}</p>
        <button className="neon-button" disabled={sendingPlan!==null||!canSend(p)} onClick={()=>void sendToGarmin(p)}>
          <RefreshCcw size={17} className={sendingPlan===p.id?"spin":""}/>
          {sendingPlan===p.id?"Enviando…":alreadyInGarmin(p)?"Ya existe en Garmin":"Enviar a Garmin"}
        </button>
        {imported(p)&&<p className="muted">Esta rutina fue importada desde Garmin: se conserva únicamente para consulta y no se puede reenviar para evitar duplicados.</p>}
        {!alreadyInGarmin(p)&&!canSend(p)&&<p className="muted">Esta rutina aún no contiene todos los códigos y repeticiones oficiales necesarios para enviarla.</p>}
      </div>)}
      <div className="exercise-grid">{todaysPlans.flatMap(p=>p.steps.map((s,i)=>({p,s,i}))).map(({p,s,i})=>
        <article className="exercise-card panel" key={p.id+"-"+i}><span className="eyebrow">{p.title} · EJERCICIO {i+1}</span><h3>{value(s.name)}</h3>
          <ExerciseDemo
            category={s.category??s.source_garmin_category}
            exerciseName={s.exercise_name??s.source_garmin_exercise_name}
            label={value(s.name)}
          />
          <div className="workout-numbers"><div><span>Series</span><strong>{value(s.sets??s.series)}</strong></div><div><span>Reps</span><strong>{value(s.reps)}</strong></div><div><span>Carga</span><strong>{value(s.weight??s.load)}</strong></div><div><span>Descanso</span><strong>{value(s.rest_seconds??s.rest)}</strong></div></div>
          <div className="guide-grid"><div><h4><CheckCircle2 size={17}/> Cómo hacerlo</h4><p>{value(s.instructions??s.technique)}</p></div><div><h4 className="warning"><AlertTriangle size={17}/> Errores frecuentes</h4><p>{value(s.mistakes)}</p></div></div>
          <div className="safety"><ShieldCheck size={17}/> {value(s.safety??"Precauciones técnicas aún no registradas para este movimiento.")}</div>

        </article>)}</div>
    </>}
    {tab==="food"&&<><p className="muted">{periodCaption} · En la vista semanal, cada columna es un día y cada fila una franja de comida.</p>
      {period==="week"?<MealWeekGrid meals={todaysMeals} dates={activeDates} selectedDate={date} onSelectDay={setDate}/>:
        <MealGroups meals={todaysMeals} dates={activeDates}/>}
    </>}
    {tab==="history"&&<>
      <p className="muted">{periodCaption} · Selecciona Día o Semana arriba para cambiar el período.</p>
      {period==="week"&&<div className="panel history-card"><h2><CalendarDays size={20}/> Resumen de la semana</h2>
        <div className="weekly-overview">{activeDates.map(d=>{const day=byDay.get(d);const mealCount=(data?.meals||[]).filter(m=>m.date===d).length;
          const planCount=(data?.plans||[]).filter(p=>p.date===d).length;
          return <button className={"week-day "+(date===d?"chosen":"")} key={d} type="button" onClick={()=>{setDate(d);setPeriod("day");}}>
            <strong>{new Date(d+"T12:00:00Z").toLocaleDateString("es-CL",{weekday:"short",day:"numeric"})}</strong>
            <span>{fmt(metric(day,"pasos"))} pasos</span><span>{fmt(metric(day,"sueño"),1)} h sueño</span>
            <small>{mealCount} comidas · {planCount} rutinas</small>
          </button>;})}</div>
        <p className="muted">Selecciona un día para ver su detalle. Las cifras proceden de la última sincronización de cada fecha.</p>
      </div>}
      <div className="subtabs history-tabs">{["Resumen","Salud","Ejercicio","Alimentación","Recuperación"].map(k=><button key={k} className={detail===k?"selected":""} onClick={()=>setDetail(k)}>{k}</button>)}</div>
      {(detail==="Resumen"||detail==="Salud")&&<div className="metric-grid"><Kpi label="Pasos" number={metric(chosen,"pasos")}/><Kpi label="Sueño" number={metric(chosen,"sueño")} unit="h"/><Kpi label="Estrés" number={metric(chosen,"estrés")}/><Kpi label="Body Battery" number={metric(chosen,"battery")}/></div>}
      {(detail==="Resumen"||detail==="Recuperación")&&<div className="panel history-card"><h2><HeartPulse size={20}/> Recuperación</h2><div className="detail-grid"><div><span>VFC nocturna</span><strong>{fmt(metric(chosen,"vfc"))} ms</strong></div><div><span>FC reposo</span><strong>{fmt(metric(chosen,"reposo"))} lpm</strong></div><div><span>Readiness</span><strong>{value(Array.isArray(chosen?.readiness)?getObj(chosen.readiness[0]).score:getObj(chosen?.readiness).score)}</strong></div><div><span>Última sincronización</span><strong>{chosen?new Date(chosen.synced_at).toLocaleTimeString("es-CL"):"—"}</strong></div></div></div>}
      {(detail==="Resumen"||detail==="Ejercicio")&&<div className="panel history-card"><h2><Dumbbell size={20}/> Actividades Garmin</h2><pre className="json-preview">{chosen?.activities?JSON.stringify(chosen.activities,null,2):"Sin actividad sincronizada."}</pre></div>}
      {(detail==="Resumen"||detail==="Alimentación")&&<div className="panel history-card"><h2><Utensils size={20}/> Comidas</h2><MealGroups meals={todaysMeals} dates={activeDates}/></div>}
    </>}
    {tab==="progress"&&<>
      <div className="metric-grid"><Kpi label="Días Garmin sincronizados" number={days.length}/><Kpi label="Días con comidas" number={new Set((data?.meals||[]).map(m=>m.date)).size}/><Kpi label="Días con actividad" number={days.filter(d=>Array.isArray(getObj(d.activities).activities)&&((getObj(d.activities).activities as unknown[]).length>0)).length}/><Kpi label="Días con sueño" number={days.filter(d=>metric(d,"sueño")!==null).length}/></div>
      <TrendExplorer days={days} meals={data?.meals||[]} date={date}/>
    </>}
    {tab==="catalog"&&<>
      <div className="panel catalog-controls"><div className="search-input"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nombre Garmin o español…"/></div><div className="filter-grid"><label>Categoría<input placeholder="Ej. BENCH_PRESS" value={category} onChange={e=>setCategory(e.target.value)}/></label><label>Músculo<input placeholder="Ej. CHEST" value={muscle} onChange={e=>setMuscle(e.target.value)}/></label><label>Equipamiento<input placeholder="Ej. DUMBBELL" value={equipment} onChange={e=>setEquipment(e.target.value)}/></label></div><p className="muted">{catalogError||total+" coincidencias Garmin; mostrando "+catalog.length+". Búsqueda dinámica."}</p></div>
      <div className="catalog-grid">{catalog.map(e=><div className="panel catalog-card" key={e.category+"/"+e.exercise_name}><span className="chip lime">{e.category}</span><h3>{e.name_es||e.name_en}</h3><p className="muted">{e.name_en}</p><ExerciseDemo category={e.category} exerciseName={e.exercise_name} label={e.name_es||e.name_en}/><p>{e.primary_muscles.join(", ")||"Músculo no especificado"}</p><p className="muted">{e.equipment.join(", ")||"Equipo no especificado"}</p><span className="chip">{e.exercise_name}</span></div>)}</div>
    </>}
  </div>;
}
