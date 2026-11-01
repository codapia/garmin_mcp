"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Pause, Play } from "lucide-react";

/**
 * Static SVG frames bundled under /public/exercise-demos.
 * Each key is an exact Garmin category/exercise_name pair; never infer a match
 * from a body part or a broadly similar label.
 *
 * The selected illustrations come from Flow Exercise Dataset (CC0-1.0 artwork,
 * provenance limitations documented in EXERCISE_MEDIA.md). Motion is
 * illustrative and is not validated movement coaching or a prescribed tempo.
 */
type Demo={id:string;variant?:string};
const DEMOS:Record<string,Demo>={
  "SQUAT/GOBLET_SQUAT":{id:"1760",variant:"Sentadilla goblet con mancuerna"},
  "LUNGE/DUMBBELL_REVERSE_LUNGE":{id:"0381",variant:"Zancada inversa con mancuernas"},
  "CALF_RAISE/WEIGHTED_SEATED_CALF_RAISE":{id:"1379",variant:"Gemelos sentado con mancuerna"},
  "HIP_STABILITY/DEAD_BUG":{id:"0276",variant:"Dead bug sin carga"},
  "BENCH_PRESS/DUMBBELL_BENCH_PRESS":{id:"0289",variant:"Press plano con mancuernas"},
  "BENCH_PRESS/INCLINE_DUMBBELL_BENCH_PRESS":{id:"0314",variant:"Press inclinado con mancuernas"},
  "CURL/INCLINE_DUMBBELL_BICEPS_CURL":{id:"0315",variant:"Curl en banco inclinado"},
  "TRICEPS_EXTENSION/DUMBBELL_LYING_TRICEPS_EXTENSION":{id:"0351",variant:"Extensión de tríceps tumbado"},
  "DEADLIFT/ROMANIAN_DEADLIFT":{id:"1459",variant:"Ejemplo de peso muerto rumano con mancuernas"},
  "SHOULDER_PRESS/DUMBBELL_SHOULDER_PRESS":{id:"0405",variant:"Ejemplo de press sentado con mancuernas"},
  "BANDED_EXERCISES/ROW":{id:"3144",variant:"Ejemplo de remo sentado con banda"},
  "BANDED_EXERCISES/CURL":{id:"3123",variant:"Curl de bíceps sentado con banda"}
};
export const EXERCISE_DEMO_LIBRARY=[
  {category:"BANDED_EXERCISES",exercise_name:"CURL",name_es:"Curl de bíceps con banda",name_en:"Banded Curl",primary_muscles:["BICEPS"],equipment:["BAND"]},
  {category:"BANDED_EXERCISES",exercise_name:"ROW",name_es:"Remo con banda",name_en:"Banded Row",primary_muscles:["BACK"],equipment:["BAND"]},
  {category:"BENCH_PRESS",exercise_name:"DUMBBELL_BENCH_PRESS",name_es:"Press plano con mancuernas",name_en:"Dumbbell Bench Press",primary_muscles:["CHEST"],equipment:["DUMBBELL","BENCH"]},
  {category:"BENCH_PRESS",exercise_name:"INCLINE_DUMBBELL_BENCH_PRESS",name_es:"Press inclinado con mancuernas",name_en:"Incline Dumbbell Bench Press",primary_muscles:["CHEST"],equipment:["DUMBBELL","BENCH"]},
  {category:"CURL",exercise_name:"INCLINE_DUMBBELL_BICEPS_CURL",name_es:"Curl inclinado con mancuernas",name_en:"Incline Dumbbell Biceps Curl",primary_muscles:["BICEPS"],equipment:["DUMBBELL","BENCH"]},
  {category:"TRICEPS_EXTENSION",exercise_name:"DUMBBELL_LYING_TRICEPS_EXTENSION",name_es:"Extensión de tríceps tumbado",name_en:"Dumbbell Lying Triceps Extension",primary_muscles:["TRICEPS"],equipment:["DUMBBELL","BENCH"]},
  {category:"SQUAT",exercise_name:"GOBLET_SQUAT",name_es:"Sentadilla goblet",name_en:"Goblet Squat",primary_muscles:["QUADRICEPS","GLUTES"],equipment:["DUMBBELL"]},
  {category:"LUNGE",exercise_name:"DUMBBELL_REVERSE_LUNGE",name_es:"Zancada inversa con mancuernas",name_en:"Dumbbell Reverse Lunge",primary_muscles:["QUADRICEPS","GLUTES"],equipment:["DUMBBELL"]},
  {category:"CALF_RAISE",exercise_name:"WEIGHTED_SEATED_CALF_RAISE",name_es:"Elevación de gemelos sentado",name_en:"Weighted Seated Calf Raise",primary_muscles:["CALVES"],equipment:["DUMBBELL","BENCH"]},
  {category:"HIP_STABILITY",exercise_name:"DEAD_BUG",name_es:"Dead bug",name_en:"Dead Bug",primary_muscles:["ABS","CORE"],equipment:["BODYWEIGHT"]},
  {category:"DEADLIFT",exercise_name:"ROMANIAN_DEADLIFT",name_es:"Peso muerto rumano",name_en:"Romanian Deadlift",primary_muscles:["GLUTES","HAMSTRINGS"],equipment:["DUMBBELL"]},
  {category:"SHOULDER_PRESS",exercise_name:"DUMBBELL_SHOULDER_PRESS",name_es:"Press de hombros con mancuernas",name_en:"Dumbbell Shoulder Press",primary_muscles:["SHOULDERS"],equipment:["DUMBBELL"]}
];
export function hasExerciseDemo(category:unknown,exerciseName:unknown):boolean{
  return typeof category==="string"&&typeof exerciseName==="string" &&
    Boolean(DEMOS[category.toUpperCase()+"/"+exerciseName.toUpperCase()]);
}

const FRAME_SEQUENCE=[0,1,2,1] as const;
const BASE="/exercise-demos/";

export function ExerciseDemo({category,exerciseName,label}:{category?:unknown;exerciseName?:unknown;label:string}){
  const key=typeof category==="string"&&typeof exerciseName==="string"
    ?category.toUpperCase()+"/"+exerciseName.toUpperCase():"";
  const demo=DEMOS[key];
  return <ExerciseDemoPlayer key={key} demo={demo} label={label}/>;
}
function ExerciseDemoPlayer({demo,label}:{demo:Demo|undefined;label:string}){
  const root=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false);
  const [paused,setPaused]=useState(false);
  const [reduced,setReduced]=useState(false);
  const [index,setIndex]=useState(0);
  const [errored,setErrored]=useState(false);
  useEffect(()=>{
    const query=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReduced(query.matches);
    update();
    query.addEventListener?.("change",update);
    return ()=>query.removeEventListener?.("change",update);
  },[]);
  useEffect(()=>{
    if(!demo)return;
    const target=root.current;
    if(!target)return;
    if(!("IntersectionObserver" in window)){setVisible(true);return;}
    const observer=new IntersectionObserver(([entry])=>setVisible(Boolean(entry?.isIntersecting)),{rootMargin:"120px"});
    observer.observe(target);
    return ()=>observer.disconnect();
  },[demo]);
  useEffect(()=>{
    if(!demo||!visible||errored)return;
    // Preload all frames so playback doesn't flash a blank frame.
    for(let i=0;i<3;i++){const image=new window.Image();image.src=BASE+demo.id+"/frame-0"+i+".svg";}
  },[demo,visible,errored]);
  useEffect(()=>{
    if(!demo||!visible||paused||reduced||errored)return;
    const timer=window.setInterval(()=>setIndex(i=>(i+1)%FRAME_SEQUENCE.length),320);
    return ()=>window.clearInterval(timer);
  },[demo,visible,paused,reduced,errored]);
  if(!demo)return <div className="exercise-demo-empty">
    <AlertTriangle size={18}/><span>Demostración no disponible para esta variante exacta de Garmin. Consulta las indicaciones del ejercicio.</span>
  </div>;
  const frame=FRAME_SEQUENCE[reduced?0:index];
  return <div ref={root} className="exercise-demo" aria-label={"Ilustración de "+label}>
    {!errored?<img
      src={BASE+demo.id+"/frame-0"+frame+".svg"}
      alt={"Ilustración de "+demo.variant}
      loading="lazy" decoding="async"
      onError={()=>setErrored(true)}
      className="exercise-demo-image"
    />:<div className="exercise-demo-empty"><AlertTriangle size={17}/> No fue posible cargar la animación de este ejercicio.</div>}
    <div className="exercise-demo-footer">
      <span>{demo.variant}{reduced?" · imagen fija":""}</span>
      {!errored&&!reduced&&<button type="button" className="exercise-demo-control"
        aria-label={paused?"Reproducir animación":"Pausar animación"}
        title={paused?"Reproducir":"Pausar"}
        onClick={()=>setPaused(v=>!v)}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>}
    </div>
    <p className="exercise-demo-credits">Ilustración animada orientativa · Flow Exercise Dataset (CC0). No sustituye una demostración técnica supervisada.</p>
  </div>;
}
