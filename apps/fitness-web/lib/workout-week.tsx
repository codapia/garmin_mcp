"use client";

import { useState } from "react";
import { CalendarDays, Dumbbell, Pencil, Save, X } from "lucide-react";
import { longDate, shortDate } from "./fitness-insights";
import type { GarminActivity } from "./workout-reconciliation";
import { timedStepBreakdown } from "./workout-duration";

export type WorkoutPlan={
  id:string;date:string;title:string;steps:Record<string,unknown>[];
  version:number;garmin_workout_id:string|null;
};
const formatKg=(n:number)=>n.toLocaleString("es-CL",{maximumFractionDigits:2});
const text=(v:unknown)=>typeof v==="string"?v:"";
const num=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?v:null;

export function loadDisplay(step:Record<string,unknown>):{label:string;status:string;detail:string}{
  const local=num(step.fitness_load_kg);
  if(local!==null){
    const scope=step.fitness_load_scope==="per_hand"?"por mano":"total";
    return {label:formatKg(local)+" kg",status:"Registrado en Fitness",detail:scope+" · carga planificada; no confirma peso realmente levantado"};
  }
  const original=num(step.weight_kg)??num(step.load_kg)??num(step.weight);
  if(original!==null&&original>=0)return {label:formatKg(original)+" kg",status:"Indicado en el plan",detail:"Revisar si es por mano o total"};
  const raw=text(step.load)||text(step.weight);
  const clean=raw.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*(kg|kilos?)\b/i);
  if(clean)return {label:clean[1].replace(".",",")+(clean[2]?"–"+clean[2].replace(".",","):"")+" kg",status:"Indicado en el plan",detail:/por (mano|mancuerna)/i.test(raw)?"por mano":"alcance sin especificar"};
  const instructions=text(step.instructions);
  // Imported Garmin descriptions may contain a training recommendation, but not an actual lift.
  const suggestion=instructions.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*kg\s*(por (?:mancuerna|mano))?/i);
  if(suggestion)return {
    label:suggestion[1].replace(".",",")+(suggestion[2]?"–"+suggestion[2].replace(".",","):"")+" kg",
    status:"Sugerido en la descripción",detail:suggestion[3]?"por mano · no es un peso realizado":"no es un peso realizado"
  };
  const isCycling=/cycl|bici|pedal/i.test(text(step.source_garmin_sport)+" "+text(step.name));
  const isBodyweight=/sin carga|flexion|plancha|dead bug|dominada|air squat/i.test(text(step.name));
  return {label:isCycling?"Resistencia sin dato":isBodyweight?"Peso corporal / sin kg":"— kg",status:"No informado por Garmin",detail:"Puedes registrar una carga planificada en Fitness"};
}

export function WorkoutWeekGrid({plans,activities,dates,selectedDate,onSelectDay}:{
  plans:WorkoutPlan[];activities:GarminActivity[];dates:string[];selectedDate:string;onSelectDay:(date:string)=>void;
}){
  const rows=[
    {id:"strength",title:"Fuerza",subtitle:"Mancuernas, banco, bandas"},
    {id:"cardio",title:"Cardio",subtitle:"Bicicleta y resistencia"},
    {id:"other",title:"Otros",subtitle:"Sin clasificar"}
  ];
  function kind(plan:WorkoutPlan){
    const sport=plan.steps.map(s=>text(s.source_garmin_sport)).join(" ").toLowerCase();
    // A mixed full-body plan often includes a bike warmup and cooldown.
    // Keep it in the strength row when it contains strength sets/reps.
    if(plan.steps.some(s=>Number(s.sets)>0&&Number(s.reps)>0))return "strength";
    if(/cycling|running|cardio|swimming/.test(sport)||/bici|cardio|ciclismo/i.test(plan.title))return "cardio";
    if(sport.includes("strength")||plan.steps.some(s=>Boolean(s.category||s.source_garmin_category)))return "strength";
    return "other";
  }
  function activityKind(activity:GarminActivity){
    const sport=activity.type.toLowerCase();
    if(/cycl|running|cardio|swimming|walk|rowing/.test(sport))return "cardio";
    if(/strength|weight|resistance/.test(sport))return "strength";
    return "other";
  }
  return <section className="panel workout-week-section">
    <div className="meal-day-heading"><h2><CalendarDays size={20}/> Semana de entrenamiento</h2>
      <span>Realizado según Garmin; los planes pendientes aparecen aparte</span></div>
    <div className="meal-week-scroll" tabIndex={0} role="region" aria-label="Entrenamientos de lunes a domingo, desplazamiento horizontal">
      <div className="meal-week-grid workout-week-grid" role="table" aria-label="Plan semanal por día y tipo">
        <div className="week-corner" role="columnheader">Tipo</div>
        {dates.map(d=><button type="button" role="columnheader" key={d}
          className={"week-col-heading "+(d===selectedDate?"chosen":"")}
          aria-current={d===selectedDate?"date":undefined}
          aria-label={"Ver entrenamientos de "+longDate(d)}
          onClick={()=>onSelectDay(d)}>
          <strong>{new Date(d+"T12:00:00Z").toLocaleDateString("es-CL",{weekday:"short"})}</strong>
          <span>{shortDate(d)}</span>
        </button>)}
        {rows.map(row=><div key={row.id} role="row" className="meal-week-row">
          <div className="week-row-label" role="rowheader"><strong>{row.title}</strong><small>{row.subtitle}</small></div>
          {dates.map(d=>{
            const completed=activities.filter(a=>a.date===d&&activityKind(a)===row.id);
            const scheduled=plans.filter(p=>p.date===d&&kind(p)===row.id);
            return <div role="cell" key={row.id+d} className={"meal-week-cell "+(d===selectedDate?"current":"")}>
              {completed.map(activity=><button type="button" key={activity.id} className="workout-week-entry"
                onClick={()=>onSelectDay(d)} aria-label={"Actividad Garmin realizada: "+activity.name}>
                <strong>{activity.name}</strong><span>Realizado · Garmin {activity.duration_seconds!==null?"· "+Math.round(activity.duration_seconds/60)+" min":""}</span>
              </button>)}
              {scheduled.map(plan=><button type="button" key={plan.id} className="workout-week-entry planned"
                onClick={()=>onSelectDay(d)} aria-label={"Plan pendiente: "+plan.title}>
                <strong>{plan.title.replace(/^Importada de Garmin\s*·\s*/,"")}</strong>
                <span>Programado · no realizado</span>
                {timedStepBreakdown(plan.steps)&&<span>{timedStepBreakdown(plan.steps)}</span>}
              </button>)}
              {!completed.length&&!scheduled.length&&<span className="week-cell-empty">—</span>}
            </div>;
          })}
        </div>)}
      </div>
    </div>
    <p className="muted meal-day-note">«Realizado» solo corresponde a actividades con ID de Garmin. Los planes no realizados de días anteriores no se muestran como sesiones. Una casilla vacía sin Garmin sincronizado no demuestra descanso.</p>
  </section>;
}

export function ExerciseLoad({plan,step,index,onSaved}:{
  plan:WorkoutPlan;step:Record<string,unknown>;index:number;onSaved:()=>Promise<void>;
}){
  const [editing,setEditing]=useState(false);
  const [kg,setKg]=useState("");
  const [scope,setScope]=useState<"total"|"per_hand">("per_hand");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const display=loadDisplay(step);
  async function save(){
    const n=Number(kg.replace(",","."));
    if(!Number.isFinite(n)||n<0||n>100){setMessage("Ingresa una carga entre 0 y 100 kg.");return;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/fitness/load",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({plan_id:plan.id,expected_version:plan.version,step_index:index,kg:n,scope})
      });
      const data=await response.json();
      if(!response.ok||!data.ok)throw Error(data.error||"No se pudo guardar la carga");
      await onSaved();setEditing(false);setMessage("Guardado en Fitness. Garmin no se modificó.");
    }catch(e){setMessage(e instanceof Error?e.message:"Error al guardar");}
    finally{setBusy(false);}
  }
  return <div className="exercise-load">
    <div className="exercise-load-current">
      <div><span>Carga del ejercicio</span><strong>{display.label}</strong>
        <small>{display.status} · {display.detail}</small></div>
      <button type="button" onClick={()=>{setEditing(v=>!v);setMessage("");}}
        aria-label={editing?"Cancelar edición de carga":"Anotar carga en kg"} title="Anotar kilos en Fitness">
        {editing?<X size={16}/>:<Pencil size={16}/>} {editing?"Cancelar":"Anotar kg"}
      </button>
    </div>
    {editing&&<div className="exercise-load-form">
      <label>Kg de carga planificada
        <input type="number" min="0" max="100" step="0.5" inputMode="decimal" value={kg}
          placeholder="Ej. 6" onChange={e=>setKg(e.target.value)}/></label>
      <label>Alcance
        <select value={scope} onChange={e=>setScope(e.target.value as "total"|"per_hand")}>
          <option value="per_hand">Kg por mano</option><option value="total">Kg totales</option>
        </select></label>
      <button type="button" onClick={()=>void save()} disabled={busy||kg.trim()===""}>
        <Save size={16}/>{busy?"Guardando…":"Guardar en Fitness"}
      </button>
      <p>Esto registra la carga planificada en Fitness; no modifica Garmin ni confirma que el ejercicio se haya realizado.</p>
    </div>}
    {message&&<p role="status" className="exercise-load-message">{message}</p>}
  </div>;
}
