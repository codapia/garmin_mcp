"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Dumbbell, Info, Search } from "lucide-react";

type MuscleExercise={
  id:string;
  name:string;
  body_part:string;
  equipment:string;
  target:string;
  muscle_group:string;
  secondary_muscles:string[];
  instructions_es:string;
};
const SOURCE="https://github.com/hasaneyldrm/exercises-dataset";
const DATA_PATH="/data/exercises-dataset-metadata.json";
const CHUNK=36;

const translation:Record<string,string>={
  "waist":"Abdomen y cintura","upper arms":"Brazos","lower arms":"Antebrazos",
  "upper legs":"Piernas","lower legs":"Pantorrillas","back":"Espalda",
  "chest":"Pecho","shoulders":"Hombros","cardio":"Cardio","neck":"Cuello",
  "abs":"Abdominales","biceps":"Bíceps","triceps":"Tríceps",
  "pectorals":"Pectorales","glutes":"Glúteos","quads":"Cuádriceps",
  "hamstrings":"Isquiotibiales","calves":"Pantorrillas",
  "dumbbell":"Mancuernas","body weight":"Peso corporal",
  "barbell":"Barra","kettlebell":"Pesa rusa","band":"Banda elástica",
  "lats":"Dorsales","delts":"Deltoides","obliques":"Oblicuos",
  "hip flexors":"Flexores de cadera","lower back":"Zona lumbar",
  "upper back":"Espalda superior","forearms":"Antebrazos",
  "levator scapulae":"Elevador de la escápula","serratus anterior":"Serrato anterior",
  "traps":"Trapecios","adductors":"Aductores","abductors":"Abductores"
};
function muscleLabel(label:string){return translation[label.toLowerCase()]||label;}
function matches(s:string,q:string){return s.toLocaleLowerCase().includes(q.toLocaleLowerCase());}

export function ExerciseMuscleLibrary({query,category,muscle,equipment}:{
  query:string;category:string;muscle:string;equipment:string;
}){
  const [data,setData]=useState<MuscleExercise[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [limit,setLimit]=useState(CHUNK);

  useEffect(()=>{
    const controller=new AbortController();
    fetch(DATA_PATH,{signal:controller.signal,cache:"force-cache"})
      .then(async r=>{if(!r.ok)throw Error("No se pudo leer la biblioteca muscular");return r.json();})
      .then((json:unknown)=>{
        if(!Array.isArray(json)||json.length!==1324)throw Error("Biblioteca incompleta; prueba actualizar la página");
        if(!controller.signal.aborted){
          setData(json as MuscleExercise[]);
          setError("");
        }
      }).catch(e=>{
        if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Error de carga");
      }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[]);
  useEffect(()=>setLimit(CHUNK),[query,category,muscle,equipment]);
  const results=useMemo(()=>data.filter(e=>
    (!query||[e.name,e.target,e.body_part,e.equipment,e.muscle_group,...e.secondary_muscles].some(v=>matches(v,query)))&&
    (!category||matches(e.body_part,category)||matches(muscleLabel(e.body_part),category))&&
    (!muscle||[e.target,e.muscle_group,...e.secondary_muscles].some(v=>matches(v,muscle)||matches(muscleLabel(v),muscle)))&&
    (!equipment||matches(e.equipment,equipment)||matches(muscleLabel(e.equipment),equipment))
  ),[data,query,category,muscle,equipment]);
  return <section aria-label="Biblioteca de músculos y ejercicios" className="muscle-library">
    <div className="panel muscle-source-notice">
      <div className="muscle-notice-heading"><Info size={20}/><h2>Exercises Dataset · información muscular</h2></div>
      <p><strong>1.324 ejercicios</strong> con grupos musculares e instrucciones en español, incorporados desde los datos MIT del proyecto.</p>
      <p>Los GIFs anatómicos originales son propiedad de Gym visual y <strong>no están incluidos</strong> porque requieren una licencia propia. Esta vista identifica músculos descritos por el conjunto de datos, pero no mide científicamente cuánto se activa cada uno.</p>
      <a href={SOURCE} target="_blank" rel="noopener noreferrer">Fuente y licencia de los datos</a>
      <p className="muted">{loading?"Cargando biblioteca…":error||results.length+" resultados · mostrando "+Math.min(results.length,limit)}</p>
    </div>
    {!loading&&!error&&results.length===0&&<p className="muted panel">Sin ejercicios para los filtros seleccionados.</p>}
    <div className="catalog-grid">
      {results.slice(0,limit).map(e=><article className="panel catalog-card muscle-exercise-card" key={e.id}>
        <div className="muscle-exercise-heading">
          <span className="chip lime">{muscleLabel(e.body_part)}</span>
          <span className="muted">#{e.id}</span>
        </div>
        <h3>{e.name}</h3>
        <div className="muscle-target">
          <span>Músculo principal</span>
          <strong>{muscleLabel(e.target)}</strong>
        </div>
        {e.muscle_group&&e.muscle_group!==e.target&&<div className="muscle-support"><span>Grupo complementario</span><strong>{muscleLabel(e.muscle_group)}</strong></div>}
        {!!e.secondary_muscles.length&&<div className="muscle-chips">{[...new Set(e.secondary_muscles)].map(m=><span className="muscle-chip" key={m}>{muscleLabel(m)}</span>)}</div>}
        <p className="muted muscle-equipment"><Dumbbell size={15}/> {muscleLabel(e.equipment)}</p>
        {!!e.instructions_es&&<details className="muscle-instructions"><summary><BookOpen size={16}/> Ver instrucciones en español</summary><p>{e.instructions_es}</p></details>}
        <p className="muscle-no-media"><Info size={14}/> Animación anatómica pendiente de licencia de Gym visual</p>
      </article>)}
    </div>
    {results.length>limit&&<div className="muscle-more"><button type="button" className="neon-button"
      onClick={()=>setLimit(v=>v+CHUNK)}><Search size={16}/> Mostrar {Math.min(CHUNK,results.length-limit)} ejercicios más</button></div>}
  </section>;
}
