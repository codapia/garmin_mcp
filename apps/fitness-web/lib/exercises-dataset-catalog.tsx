"use client";

import {useEffect,useMemo,useState} from "react";
import {Dumbbell,Search,ShieldAlert,ChevronDown} from "lucide-react";

/**
 * Source: hasaneyldrm/exercises-dataset (exercise metadata and Spanish instruction text, MIT).
 * The original thumbnail and GIF URLs have deliberately NOT been imported:
 * © Gym visual, third-party license required for Fitness Codapia.
 */
type Exercise={id:string;n:string;c:string;b:string;e:string;t:string;m:string;s:string[];es:string};
type Region="chest"|"abs"|"shoulders"|"upperarms"|"forearms"|"upperback"|"lowerback"|"hips"|"thighs"|"calves";
const MAPPING:Record<string,Region[]>={
  abs:["abs"],abdominals:["abs"],core:["abs"],obliques:["abs"],"lower abs":["abs"],
  pectorals:["chest"],chest:["chest"],"upper chest":["chest"],"serratus anterior":["chest"],
  delts:["shoulders"],deltoids:["shoulders"],shoulders:["shoulders"],"rotator cuff":["shoulders"],"rear deltoids":["shoulders"],
  biceps:["upperarms"],brachialis:["upperarms"],triceps:["upperarms"],
  forearms:["forearms"],"grip muscles":["forearms"],hands:["forearms"],"wrist extensors":["forearms"],"wrist flexors":["forearms"],wrists:["forearms"],
  lats:["upperback"],"latissimus dorsi":["upperback"],"upper back":["upperback"],traps:["upperback"],trapezius:["upperback"],rhomboids:["upperback"],"levator scapulae":["upperback"],
  spine:["lowerback"],"lower back":["lowerback"],
  glutes:["hips"],abductors:["hips"],"hip flexors":["hips"],adductors:["thighs"],groin:["thighs"],"inner thighs":["thighs"],
  quads:["thighs"],quadriceps:["thighs"],hamstrings:["thighs"],calves:["calves"],soleus:["calves"],ankles:["calves"],"ankle stabilizers":["calves"],feet:["calves"],shins:["calves"]
};
const ES:Record<string,string>={
  abs:"Abdominales",abdominals:"Abdominales",core:"Core",obliques:"Oblicuos",pectorals:"Pectorales",
  chest:"Pecho",biceps:"Bíceps",triceps:"Tríceps",delts:"Deltoides",deltoids:"Deltoides",
  quads:"Cuádriceps",quadriceps:"Cuádriceps",glutes:"Glúteos",hamstrings:"Isquiotibiales",
  calves:"Pantorrillas",lats:"Dorsales",traps:"Trapecios",spine:"Erectores espinales",
  forearms:"Antebrazos",shoulders:"Hombros",back:"Espalda",waist:"Cintura",cardio:"Cardio",
  "upper arms":"Brazos","upper legs":"Piernas","lower legs":"Pantorrillas","lower arms":"Antebrazos",
  "lower back":"Zona lumbar","upper back":"Espalda alta","hip flexors":"Flexores de cadera",
  "rotator cuff":"Manguito rotador",adductors:"Aductores",abductors:"Abductores",
  "cardiovascular system":"Sistema cardiovascular","body weight":"Peso corporal",
  dumbbell:"Mancuerna",barbell:"Barra",band:"Banda", "resistance band":"Banda de resistencia",
  "stationary bike":"Bicicleta estática",cable:"Polea",kettlebell:"Kettlebell"
};
function es(v:string){return ES[v.toLowerCase()]||v;}
function classNameRegion(region:Region,primary:Set<Region>,secondary:Set<Region>){
  return primary.has(region)?"primary":secondary.has(region)?"secondary":"neutral";
}
function regions(vals:string[]){
  return new Set<Region>(vals.flatMap(x=>MAPPING[x.toLowerCase()]||[]));
}
const zones:{id:Region;front:string;back:string}[]=[
  {id:"shoulders",front:"M34 35 Q22 36 18 51 L27 66 L40 52 M66 35 Q78 36 82 51 L73 66 L60 52",back:"M34 35 Q22 36 18 51 L27 66 L40 52 M66 35 Q78 36 82 51 L73 66 L60 52"},
  {id:"chest",front:"M39 44 Q50 38 61 44 L60 67 L40 67 Z",back:""},
  {id:"abs",front:"M41 68 L59 68 L57 100 L43 100 Z",back:""},
  {id:"upperarms",front:"M21 55 L30 61 L24 88 L15 82 Z M70 61 L79 55 L85 82 L76 88 Z",back:"M21 55 L30 61 L24 88 L15 82 Z M70 61 L79 55 L85 82 L76 88 Z"},
  {id:"forearms",front:"M15 83 L24 89 L21 115 L10 113 Z M76 89 L85 83 L90 113 L79 115 Z",back:"M15 83 L24 89 L21 115 L10 113 Z M76 89 L85 83 L90 113 L79 115 Z"},
  {id:"upperback",front:"",back:"M38 43 Q50 38 62 43 L63 77 L50 86 L37 77 Z"},
  {id:"lowerback",front:"",back:"M40 79 L60 79 L58 101 L42 101 Z"},
  {id:"hips",front:"M42 101 L58 101 L63 121 L37 121 Z",back:"M40 100 L60 100 L65 122 L35 122 Z"},
  {id:"thighs",front:"M36 122 L48 123 L46 172 L33 169 Z M52 123 L64 122 L67 169 L54 172 Z",back:"M36 122 L48 123 L46 172 L33 169 Z M52 123 L64 122 L67 169 L54 172 Z"},
  {id:"calves",front:"M34 171 L46 173 L45 214 L35 214 Z M54 173 L66 171 L65 214 L55 214 Z",back:"M34 171 L46 173 L45 214 L35 214 Z M54 173 L66 171 L65 214 L55 214 Z"}
];
function Figure({back,primary,secondary}:{back:boolean;primary:Set<Region>;secondary:Set<Region>}){
  return <svg viewBox="0 0 100 232" role="img" aria-label={back?"Vista posterior del cuerpo":"Vista anterior del cuerpo"}>
    <g fill="#334538" stroke="#6c826c" strokeWidth="1.3" strokeLinejoin="round">
      <circle cx="50" cy="17" r="15"/>
      <path d="M41 30 L59 30 L67 40 L80 48 L90 112 L79 118 L72 88 L68 117 L68 171 L66 216 L77 224 L77 230 L52 230 L51 171 L49 171 L48 230 L23 230 L23 224 L34 216 L32 171 L32 117 L28 88 L21 118 L10 112 L20 48 L33 40 Z"/>
    </g>
    {zones.map(z=>{
      const path=back?z.back:z.front;
      if(!path)return null;
      const state=classNameRegion(z.id,primary,secondary);
      return <path key={z.id} d={path} stroke="#182a1c" strokeWidth="1.3"
        fill={state==="primary"?"#b8ff17":state==="secondary"?"#67cde1":"#344639"}
        opacity={state==="neutral"?.38:.95}/>;
    })}
    <text x="50" y="229" fontSize="8.5" textAnchor="middle" fill="#aebdad">{back?"Posterior":"Anterior"}</text>
  </svg>;
}
function MuscleMap({entry}:{entry:Exercise}){
  const primary=regions([entry.t]),secondary=regions([entry.m,...entry.s]);
  return <div className="muscle-map">
    <div className="muscle-figures"><Figure back={false} primary={primary} secondary={secondary}/><Figure back={true} primary={primary} secondary={secondary}/></div>
    <div className="muscle-map-key"><span><i className="primary"/> Principal</span><span><i className="secondary"/> Secundario</span></div>
    <p>Esquema orientativo de regiones corporales según los metadatos del ejercicio; no representa intensidad ni medición real de activación muscular.</p>
  </div>;
}
function ExerciseCard({entry}:{entry:Exercise}){
  const [open,setOpen]=useState(false);
  return <article className="panel ext-exercise-card">
    <div className="ext-card-top"><span className="chip lime">{es(entry.c)}</span><span className="ext-id">#{entry.id}</span></div>
    <h3>{entry.n}</h3>
    <p className="muted">{es(entry.e)} · {es(entry.b)}</p>
    <MuscleMap entry={entry}/>
    <div className="muscle-labels"><div><strong>Principal</strong><span>{es(entry.t)}</span></div>
      <div><strong>Secundarios</strong><span>{[...new Set([entry.m,...entry.s])].filter(x=>x&&x!==entry.t).map(es).join(", ")||"No especificados"}</span></div>
    </div>
    <button type="button" className="exercise-instructions-toggle" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
      Cómo se hace (español) <ChevronDown size={16} className={open?"open":""}/>
    </button>
    {open&&<p className="exercise-instructions">{entry.es||"Sin instrucciones traducidas."}</p>}
    <p className="ext-media-note">GIF anatómico © Gym visual: pendiente de autorización para reproducirlo en Fitness. Los datos e instrucciones son MIT.</p>
  </article>;
}
export default function ExercisesDatasetCatalog(){
  const [entries,setEntries]=useState<Exercise[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("");
  const [equipment,setEquipment]=useState("");
  const [target,setTarget]=useState("");
  const [limit,setLimit]=useState(24);
  useEffect(()=>{
    let active=true;
    fetch("/data/exercises-dataset-mit.json",{cache:"force-cache"}).then(r=>{
      if(!r.ok)throw new Error("No se pudo cargar el catálogo");
      return r.json();
    }).then((value:unknown)=>{
      if(!active)return;
      if(!Array.isArray(value))throw new Error("Formato de catálogo inválido");
      setEntries(value as Exercise[]);setError("");
    }).catch(e=>{if(active)setError(e instanceof Error?e.message:"Error de catálogo");})
      .finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  },[]);
  const cats=useMemo(()=>[...new Set(entries.map(e=>e.c))].sort(),[entries]);
  const equips=useMemo(()=>[...new Set(entries.map(e=>e.e))].sort(),[entries]);
  const targets=useMemo(()=>[...new Set(entries.map(e=>e.t))].sort(),[entries]);
  const results=useMemo(()=>entries.filter(e=>{
    const q=query.trim().toLocaleLowerCase("es");
    return (!q||[e.n,e.c,e.e,e.t,e.m,...e.s,e.es].some(v=>v.toLocaleLowerCase("es").includes(q)))&&
      (!category||e.c===category)&&(!equipment||e.e===equipment)&&(!target||e.t===target);
  }),[entries,query,category,equipment,target]);
  return <div className="exercises-dataset">
    <div className="panel exercises-source-note"><Dumbbell size={20}/><div>
      <strong>Exercises Dataset · {entries.length||"1.324"} ejercicios</strong>
      <p>Metadatos e instrucciones en español (licencia MIT), con un esquema muscular propio. <strong>Los GIFs anatómicos de Gym visual no se reproducen sin licencia.</strong> No se asignan automáticamente a códigos Garmin.</p>
    </div></div>
    <div className="panel catalog-controls">
      <div className="search-input"><Search size={19}/><input value={query} onChange={e=>{setQuery(e.target.value);setLimit(24)}} placeholder="Buscar ejercicio, músculo o indicación…"/></div>
      <div className="filter-grid">
        <label>Zona<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(24)}}><option value="">Todas</option>{cats.map(x=><option key={x} value={x}>{es(x)}</option>)}</select></label>
        <label>Músculo principal<select value={target} onChange={e=>{setTarget(e.target.value);setLimit(24)}}><option value="">Todos</option>{targets.map(x=><option key={x} value={x}>{es(x)}</option>)}</select></label>
        <label>Equipamiento<select value={equipment} onChange={e=>{setEquipment(e.target.value);setLimit(24)}}><option value="">Todos</option>{equips.map(x=><option key={x} value={x}>{es(x)}</option>)}</select></label>
      </div>
      <p className="muted">{loading?"Cargando ejercicios…":error||results.length+" coincidencias · mostrando "+Math.min(limit,results.length)+"."}</p>
    </div>
    {!loading&&!error&&<div className="catalog-grid">{results.slice(0,limit).map(x=><ExerciseCard key={x.id} entry={x}/>)}</div>}
    {error&&<div className="panel"><ShieldAlert size={20}/> {error}</div>}
    {limit<results.length&&<div className="exercises-more"><button type="button" onClick={()=>setLimit(v=>v+24)}>Ver 24 más</button></div>}
    <p className="muted exercises-license">Fuente: <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener noreferrer">Exercises Dataset</a> · © Hasan Emir Yıldırım, datos e instrucciones MIT. Los GIFs y miniaturas son © Gym visual y requieren su propia licencia.</p>
  </div>;
}
