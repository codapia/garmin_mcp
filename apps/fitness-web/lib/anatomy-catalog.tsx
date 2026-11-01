"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, ChevronDown, Dumbbell, ShieldCheck } from "lucide-react";

export type AnatomyExercise={
  id:string;name:string;category:string;body_part:string;equipment:string;
  target:string;secondary_muscles:string[];instructions_es:string[];
};
const LABEL:Record<string,string>={
 "abductors":"Abductores","abs":"Abdominales","adductors":"Aductores",
 "biceps":"Bíceps","calves":"Pantorrillas","cardiovascular system":"Sistema cardiovascular",
 "delts":"Deltoides","forearms":"Antebrazos","glutes":"Glúteos",
 "hamstrings":"Isquiotibiales","lats":"Dorsales","levator scapulae":"Elevador de la escápula",
 "pectorals":"Pectorales","quads":"Cuádriceps","serratus anterior":"Serrato anterior",
 "spine":"Espalda / erectores","traps":"Trapecios","triceps":"Tríceps",
 "upper back":"Espalda superior","lower back":"Espalda lumbar","hip flexors":"Flexores de cadera",
 "obliques":"Oblicuos","rotator cuff":"Manguito rotador","neck":"Cuello"
};
const bodyLabel=(s:string)=>LABEL[s.toLowerCase()]||s;
const clean=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const LIME="#b8ff17", BLUE="#6ad6ff", NEUTRAL="#39473e";
const regions={
 front:{
  "delts":["M58 79 L75 69 L75 108 L65 118 Z","M142 79 L125 69 L125 108 L135 118 Z"],
  "pectorals":["M78 81 Q90 77 99 86 L99 110 L78 112 Z","M101 86 Q110 77 122 81 L122 112 L101 110 Z"],
  "serratus anterior":["M76 112 L86 117 L82 146 L76 138 Z","M124 112 L114 117 L118 146 L124 138 Z"],
  "biceps":["M59 115 L72 116 L67 154 L54 149 Z","M141 115 L128 116 L133 154 L146 149 Z"],
  "forearms":["M54 151 L67 156 L61 204 L48 202 Z","M146 151 L133 156 L139 204 L152 202 Z"],
  "abs":["M88 117 L112 117 L113 169 L87 169 Z"],
  "obliques":["M77 140 L87 139 L88 174 L80 172 Z","M123 140 L113 139 L112 174 L120 172 Z"],
  "hip flexors":["M87 172 L100 180 L91 197 L80 191 Z","M113 172 L100 180 L109 197 L120 191 Z"],
  "adductors":["M91 199 L99 202 L97 254 L88 242 Z","M109 199 L101 202 L103 254 L112 242 Z"],
  "abductors":["M80 192 L88 198 L83 254 L73 247 Z","M120 192 L112 198 L117 254 L127 247 Z"],
  "quads":["M80 199 L94 198 L90 260 L73 257 Z","M120 199 L106 198 L110 260 L127 257 Z"],
  "calves":["M76 270 L89 268 L85 303 L75 304 Z","M124 270 L111 268 L115 303 L125 304 Z"]
 },
 back:{
  "traps":["M86 68 L100 84 L114 68 L127 90 L100 110 L73 90 Z"],
  "levator scapulae":["M85 65 L99 83 L91 94 L78 79 Z","M115 65 L101 83 L109 94 L122 79 Z"],
  "delts":["M58 78 L75 69 L75 109 L65 117 Z","M142 78 L125 69 L125 109 L135 117 Z"],
  "upper back":["M80 96 L100 103 L120 96 L119 129 L81 129 Z"],
  "lats":["M77 117 L95 132 L92 165 L79 151 Z","M123 117 L105 132 L108 165 L121 151 Z"],
  "spine":["M96 117 L104 117 L106 182 L94 182 Z"],
  "lower back":["M88 154 L112 154 L115 181 L85 181 Z"],
  "triceps":["M59 116 L72 116 L67 155 L54 151 Z","M141 116 L128 116 L133 155 L146 151 Z"],
  "forearms":["M54 153 L67 157 L61 204 L48 202 Z","M146 153 L133 157 L139 204 L152 202 Z"],
  "glutes":["M81 179 L99 184 L99 214 L79 214 Z","M119 179 L101 184 L101 214 L121 214 Z"],
  "abductors":["M78 200 L87 211 L83 250 L74 246 Z","M122 200 L113 211 L117 250 L126 246 Z"],
  "hamstrings":["M82 215 L96 216 L91 263 L75 258 Z","M118 215 L104 216 L109 263 L125 258 Z"],
  "calves":["M76 270 L91 268 L86 305 L74 305 Z","M124 270 L109 268 L114 305 L126 305 Z"]
 }
} as const;
function resolve(name:string):string{
 const n=name.toLowerCase();
 if(n==="pectorals")return "pectorals";
 if(n==="upper back")return "upper back";
 if(n==="lower back")return "lower back";
 if(n==="hip flexors")return "hip flexors";
 if(n==="rotator cuff")return "delts";
 return n;
}
/** Two intentionally schematic silhouettes: illustrated regions, not clinical anatomy/EMG. */
export function MuscleMap({target,secondary=[]}:{target:string;secondary?:string[]}){
 const primary=resolve(target),other=new Set(secondary.map(resolve).filter(x=>x!==primary));
 const color=(key:string)=>key===primary?LIME:other.has(key)?BLUE:NEUTRAL;
 const outline=<>
   <ellipse cx="100" cy="32" rx="16" ry="22"/>
   <path d="M92 53 L108 53 L112 66 L128 73 L143 84 L151 134 L164 198 L153 210 L143 199 L129 150 L122 188 L124 216 L128 258 L122 312 L109 312 L105 263 L100 213 L95 263 L91 312 L78 312 L72 258 L76 216 L78 188 L71 150 L57 199 L47 210 L36 198 L49 134 L57 84 L72 73 L88 66 Z"/>
 </>;
 const pathLayers=(view:"front"|"back")=>Object.entries(regions[view]).flatMap(([key,paths])=>paths.map((p,i)=>
   <path key={key+"-"+i} d={p} fill={color(key)} stroke="#0c1710" strokeWidth="1.3" strokeLinejoin="round"/>));
 const found=Object.keys(regions.front).includes(primary)||Object.keys(regions.back).includes(primary);
 return <div className="anatomy-figure">
   <svg viewBox="0 0 400 340" role="img" aria-label={"Mapa muscular esquemático de frente y espalda. Principal: "+bodyLabel(target)+". Secundarios: "+secondary.map(bodyLabel).join(", ")}>
     <g transform="translate(0 0)"><g fill="#344239" stroke="#7f9383" strokeWidth="1.6">{outline}</g>{pathLayers("front")}
       <text x="100" y="333" textAnchor="middle" fontSize="13" fill="#bbcdba">Frente</text></g>
     <g transform="translate(200 0)"><g fill="#344239" stroke="#7f9383" strokeWidth="1.6">{outline}</g>{pathLayers("back")}
       <text x="100" y="333" textAnchor="middle" fontSize="13" fill="#bbcdba">Espalda</text></g>
   </svg>
   <div className="anatomy-legend"><span><i style={{background:LIME}}/>Principal: {bodyLabel(target)}</span>
     {secondary.length>0&&<span><i style={{background:BLUE}}/>Secundarios: {secondary.map(bodyLabel).join(", ")}</span>}
     {!found&&<small>Este objetivo no tiene región resaltada en el esquema; consulta su nombre arriba.</small>}
   </div>
   <small className="anatomy-disclaimer">Esquema ilustrativo de grupos musculares informados por el dataset; no mide activación muscular ni valida técnica.</small>
 </div>;
}
export function AnatomyLibrary({query,category,muscle,equipment}:{
 query:string;category:string;muscle:string;equipment:string;
}){
 const [entries,setEntries]=useState<AnatomyExercise[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [visible,setVisible]=useState(24);
 const [expanded,setExpanded]=useState<string|null>(null);
 useEffect(()=>{
   const controller=new AbortController();
   (async()=>{
     try{
       const groups=await Promise.all([0,1,2,3].map(async n=>{
         const response=await fetch("/anatomy-data/part-"+n+".json",{signal:controller.signal});
         if(!response.ok)throw new Error("No se pudo cargar la biblioteca de ejercicios");
         return response.json() as Promise<AnatomyExercise[]>;
       }));
       if(!controller.signal.aborted){setEntries(groups.flat());setError("");}
     }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Error de biblioteca");}
     finally{if(!controller.signal.aborted)setLoading(false);}
   })();
   return ()=>controller.abort();
 },[]);
 const filtered=useMemo(()=>{
   const q=clean(query),cat=clean(category),mus=clean(muscle),eq=clean(equipment);
   return entries.filter(e=>
     (!q||clean(e.name+" "+e.target+" "+bodyLabel(e.target)+" "+e.equipment+" "+e.instructions_es.join(" ")).includes(q))&&
     (!cat||clean(e.category+" "+e.body_part).includes(cat))&&
     (!mus||clean([e.target,...e.secondary_muscles].map(x=>x+" "+bodyLabel(x)).join(" ")).includes(mus))&&
     (!eq||clean(e.equipment).includes(eq))
   );
 },[entries,query,category,muscle,equipment]);
 useEffect(()=>{setVisible(24);setExpanded(null);},[query,category,muscle,equipment]);
 if(loading)return <div className="panel anatomy-status"><Activity size={17}/> Cargando los 1.324 ejercicios y sus grupos musculares…</div>;
 if(error)return <div className="panel anatomy-status" role="alert">{error}. Actualiza la página para reintentar.</div>;
 return <div>
   <p className="muted anatomy-intro"><ShieldCheck size={16}/> <strong>{filtered.length} de {entries.length}</strong> ejercicios con información de músculos e instrucciones en español. Datos MIT de Exercises Dataset. Los GIFs de Gym visual no están incluidos porque requieren una autorización propia.</p>
   {filtered.length===0&&<div className="panel">No hay ejercicios que coincidan con estos filtros.</div>}
   <div className="anatomy-grid">{filtered.slice(0,visible).map(e=><article className="panel anatomy-card" key={e.id}>
     <span className="eyebrow">{e.body_part} · {e.equipment}</span>
     <h3>{e.name}</h3>
     <MuscleMap target={e.target} secondary={e.secondary_muscles}/>
     <div className="anatomy-instructions">
       <button type="button" onClick={()=>setExpanded(v=>v===e.id?null:e.id)} aria-expanded={expanded===e.id}>
         <BookOpen size={16}/> {expanded===e.id?"Ocultar instrucciones":"Ver instrucciones en español"} <ChevronDown size={16}/>
       </button>
       {expanded===e.id&&<ol>{e.instructions_es.map((step,i)=><li key={i}>{step}</li>)}</ol>}
     </div>
   </article>)}</div>
   {visible<filtered.length&&<button type="button" className="neon-button anatomy-more" onClick={()=>setVisible(v=>v+24)}>Mostrar más ({Math.min(24,filtered.length-visible)} de {filtered.length-visible} pendientes)</button>}
   <p className="muted anatomy-credit">Información textual: <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener noreferrer">Exercises Dataset</a> (MIT). Las ilustraciones musculares son esquemas propios, no GIFs de Gym visual. Se mantienen por separado las animaciones SVG ya incorporadas a Fitness.</p>
 </div>;
}
