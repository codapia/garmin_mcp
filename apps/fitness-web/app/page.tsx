"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity, BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronLeft,
  ChevronRight, Dumbbell, Flame, Footprints, HeartPulse, Home, Moon,
  Pause, Play, Search, ShieldCheck, Sparkles, Timer, TrendingUp, Utensils,
  Watch, Zap, AlertTriangle, type LucideIcon,
} from "lucide-react";
import { workout, exerciseCatalog, history, crosses, type WorkoutStep, type DemoDay } from "../lib/demo-data";
import LivePortal from "../lib/live-portal";

type Tab = "home" | "workout" | "food" | "history" | "progress" | "catalog";
type HistoryTab = "overview" | "health" | "activity" | "food" | "recovery";
type CrossSize = "all" | "2" | "3" | "4";

const sections: {id:Tab; label:string; icon:LucideIcon}[] = [
  {id:"home",label:"Inicio",icon:Home},{id:"workout",label:"Rutina",icon:Dumbbell},
  {id:"food",label:"Comidas",icon:Utensils},{id:"history",label:"Histórico",icon:CalendarDays},
  {id:"progress",label:"Progreso",icon:TrendingUp},{id:"catalog",label:"Catálogo",icon:BookOpen},
];

function Card({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <div className={"panel " + className}>{children}</div>;
}

function FormatDate({date}:{date:string}) {
  return <>{new Date(date+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})}</>;
}

function Metric({icon:Icon,label,value,unit="",accent=false}:{icon:LucideIcon;label:string;value:string|number;unit?:string;accent?:boolean}) {
  return <motion.div whileHover={{y:-3}} className={"metric panel " + (accent?"metric-lime":"")}>
    <div className="metric-head"><Icon size={18}/><span>{label}</span></div>
    <strong>{value}<small>{unit}</small></strong><span className="metric-foot">Datos simulados</span>
  </motion.div>;
}

function ExerciseVisual({kind,label}:{kind:WorkoutStep["visual"];label:string}) {
  // Diagram animations are intentionally schematic; they are NOT exercise-specific verified GIFs.
  return <div className={"visual visual-"+kind} role="img" aria-label={"Demostración esquemática animada: "+label}>
    <div className="visual-aura"/>
    <svg viewBox="0 0 420 240" aria-hidden="true" className="exercise-svg">
      <defs>
        <linearGradient id="figure-grad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9ff69"/><stop offset="1" stopColor="#72e677"/></linearGradient>
      </defs>
      <path d="M28 209H394" stroke="#53634b" strokeWidth="2" strokeDasharray="5 9"/>
      {(kind==="press" || kind==="deadbug") && <g><path d="M93 179H315" stroke="#6b7380" strokeWidth="12" strokeLinecap="round"/>{kind==="press" && <path d="M140 175l57-55" stroke="#6b7380" strokeWidth="11" strokeLinecap="round"/>}</g>}
      {kind==="bike" && <g stroke="#8a94a4" strokeWidth="6" fill="none"><circle cx="128" cy="199" r="32"/><circle cx="283" cy="199" r="32"/><path d="M128 199l60-60 47 60-107 0 60-60h68m-68 0l-12-22" /></g>}
      {kind==="row" && <path d="M90 170L300 170" stroke="#bc6fff" strokeWidth="4" strokeDasharray="5 7"/>}
      <g className="figure-whole">
        <circle cx="210" cy="62" r="19" fill="#c5d6af"/>
        <path d="M197 48q12-17 25-2" stroke="#5b7158" strokeWidth="7" fill="none" strokeLinecap="round"/>
        <path d="M210 87L210 151" stroke="url(#figure-grad)" strokeWidth="23" strokeLinecap="round" className="figure-torso"/>
        <g className="figure-arms" stroke="#c5d6af" strokeWidth="12" strokeLinecap="round" fill="none">
          <path d="M201 100L164 121L143 88"/><path d="M219 100L257 121L275 88"/>
        </g>
        <g className="figure-legs" stroke="#a4c6a0" strokeWidth="15" strokeLinecap="round" fill="none">
          <path d="M203 151L174 185L169 208"/><path d="M217 151L247 185L251 208"/>
        </g>
        <g className="figure-weights" fill="#9ca9ad"><rect x="128" y="77" width="32" height="11" rx="4"/><rect x="260" y="77" width="32" height="11" rx="4"/></g>
      </g>
      <g className="visual-arrows" fill="none" stroke="#b8ff17" strokeWidth="3" strokeLinecap="round"><path d="M328 96v68m-7-9 7 9 7-9"/><path d="M103 165V96m-7 8 7-8 7 8"/></g>
    </svg>
    <span className="visual-caption"><span className="pulse-dot"/> Animación esquemática · demostración técnica por validar</span>
  </div>;
}

function ExerciseCard({step,index}:{step:WorkoutStep;index:number}) {
  return <motion.article className="exercise-card panel" initial={{opacity:0,y:15}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.08}} transition={{duration:.38,delay:Math.min(index*.045,.25)}}>
    <div className="exercise-title"><div><span className="index-bubble">{String(index+1).padStart(2,"0")}</span><span className="eyebrow">{step.group}</span></div><h3>{step.name}</h3></div>
    <ExerciseVisual kind={step.visual} label={step.name}/>
    <div className="workout-numbers"><div><span>Series</span><strong>{step.series}</strong></div><div><span>Repeticiones</span><strong>{step.reps}</strong></div><div><span>Carga</span><strong>{step.load}</strong></div><div><span>Descanso</span><strong>{step.rest}</strong></div></div>
    <div className="guide-grid">
      <div><h4><CheckCircle2 size={17}/> Cómo hacerlo</h4><ol>{step.technique.map(t=><li key={t}>{t}</li>)}</ol></div>
      <div><h4 className="warning"><AlertTriangle size={17}/> Errores frecuentes</h4><ul>{step.mistakes.map(t=><li key={t}>{t}</li>)}</ul></div>
    </div>
    <div className="safety"><ShieldCheck size={18}/><span><strong>Cuidados:</strong> {step.safety}</span></div>
  </motion.article>;
}

function MetricPlot({values,stroke="#b8ff17"}:{values:(number|null)[];stroke?:string}) {
  const clean=values.filter((n):n is number=>n!==null && Number.isFinite(n));
  if(clean.length<2)return <div className="empty-chart">Datos insuficientes</div>;
  const lo=Math.min(...clean),hi=Math.max(...clean),range=Math.max(hi-lo,1);
  const pts=values.map((v,i)=>v===null?null:[24+(i/(values.length-1))*652,180-((v-lo)/range)*135] as [number,number]);
  let path="";let started=false;pts.forEach(p=>{if(!p){started=false;return;}path+=(started?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)+" ";started=true;});
  return <svg viewBox="0 0 700 212" className="line-chart" role="img" aria-label="Gráfico ilustrativo de tendencia; datos simulados">
    <g stroke="#37463b" strokeWidth="1"><path d="M24 40H676M24 85H676M24 130H676M24 180H676"/></g>
    <path d={path} stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    {pts.map((p,i)=>p?<circle key={i} cx={p[0]} cy={p[1]} r="5" fill={stroke} stroke="#111913" strokeWidth="2"/>:null)}
    <text x="24" y="205" fill="#a9b7a3" fontSize="13">Inicio</text><text x="676" y="205" textAnchor="end" fill="#a9b7a3" fontSize="13">Último día</text>
  </svg>;
}

function demoValue(day:DemoDay,name:string):number|null {
  const key=name.toLowerCase();
  if(key.includes("sueño"))return day.sleep;
  if(key.includes("vfc"))return day.hrv;
  if(key.includes("estrés"))return day.stress;
  if(key.includes("battery")||key.includes("battery"))return day.battery;
  if(key.includes("pasos"))return day.steps;
  if(key.includes("fc")||key.includes("reposo"))return day.restingHR;
  if(key.includes("proteína"))return day.protein;
  if(key.includes("ingesta"))return day.foodKcal;
  if(key.includes("peso"))return null;
  if(key.includes("calor")||key.includes("gasto"))return day.activeKcal;
  if(key.includes("carga")||key.includes("sesion")||key.includes("volumen")||key.includes("fuerza"))return day.trainingMin;
  if(key.includes("readiness"))return day.battery;
  if(key.includes("rpe")||key.includes("fatiga"))return null;
  return day.trainingMin;
}

const detailTabs: {id:HistoryTab;label:string}[]=[
  {id:"overview",label:"Resumen"},{id:"health",label:"Salud"},{id:"activity",label:"Ejercicio"},
  {id:"food",label:"Alimentación"},{id:"recovery",label:"Recuperación"}
];

function App() {
  const [tab,setTab]=useState<Tab>("home");
  const [liveState,setLiveState]=useState<"checking"|"live"|"demo"|"error">("checking");
  useEffect(()=>{fetch("/api/fitness/timeline?start=2026-10-27&end=2026-11-01",{cache:"no-store"}).then(r=>{setLiveState(r.ok?"live":process.env.NODE_ENV==="production"?"error":"demo")}).catch(()=>setLiveState(process.env.NODE_ENV==="production"?"error":"demo"))},[]);
  const [historyTab,setHistoryTab]=useState<HistoryTab>("overview");
  const [selectedDate,setSelectedDate]=useState(history[history.length-1].date);
  const [group,setGroup]=useState("Todos");
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("Todos");
  const [muscle,setMuscle]=useState("Todos");
  const [equipment,setEquipment]=useState("Todos");
  const [cross,setCross]=useState(0);
  const [crossSize,setCrossSize]=useState<CrossSize>("all");
  const [timer,setTimer]=useState(60);
  const [isRunning,setIsRunning]=useState(false);

  useEffect(()=>{
    if(!isRunning)return;
    const id=window.setInterval(()=>setTimer(old=>{if(old<=1){setIsRunning(false);return 0;}return old-1;}),1000);
    return ()=>window.clearInterval(id);
  },[isRunning]);

  const selected=history.find(d=>d.date===selectedDate) || history[history.length-1];
  const filtered=useMemo(()=>exerciseCatalog.filter(ex=>{
    const q=query.trim().toLocaleLowerCase("es");
    return (!q || [ex.name,ex.nameEn,ex.code].some(x=>x.toLocaleLowerCase("es").includes(q))) &&
      (category==="Todos"||ex.category===category) &&
      (muscle==="Todos"||ex.muscle===muscle) &&
      (equipment==="Todos"||ex.equipment===equipment);
  }),[query,category,muscle,equipment]);
  const categories=Array.from(new Set(exerciseCatalog.map(x=>x.category)));
  const muscles=Array.from(new Set(exerciseCatalog.map(x=>x.muscle)));
  const equipments=Array.from(new Set(exerciseCatalog.map(x=>x.equipment)));
  const currentSection=sections.find(x=>x.id===tab)!;
  const visibleCrosses=crosses.map((x,i)=>({...x,i})).filter(x=>crossSize==="all"||x.metrics.length===Number(crossSize));
  const shownCross=visibleCrosses.find(x=>x.i===cross)||visibleCrosses[0];
  function go(t:Tab){setTab(t);window.scrollTo({top:0,behavior:"smooth"});}
  function changeDate(delta:number){let i=history.findIndex(x=>x.date===selectedDate);setSelectedDate(history[Math.max(0,Math.min(history.length-1,i+delta))].date);}
  function resetTimer(){setIsRunning(false);setTimer(60);}

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Zap size={21} fill="currentColor"/></div><div><strong>FITNESS</strong><span>CODAPIA</span></div></div>
      <div className="sidebar-label">TU PANEL</div>
      <nav className="side-nav" aria-label="Navegación principal">{sections.map(({id,label,icon:Icon})=>
        <button key={id} type="button" className={"nav-link "+(tab===id?"active":"")} onClick={()=>go(id)} aria-current={tab===id?"page":undefined}><Icon size={19}/><span>{label}</span>{tab===id&&<span className="nav-light"/>}</button>
      )}</nav>
      <div className="sidebar-bottom"><div className="connection-dot"/><div><strong>Garmin Connect</strong><span>Conexión pendiente en esta PWA</span></div></div>
    </aside>

    <div className="main-frame">
      <header className="header"><div className="crumb"><span>Fitness Codapia</span><ChevronRight size={15}/><strong>{currentSection.label}</strong></div><div className="header-actions"><span className="live-pill"><span className="pulse-dot"/> DEMO</span><Watch size={22}/></div></header>
      <main className="content">
        <AnimatePresence mode="wait">
          <motion.section key={tab} initial={{opacity:0,y:13}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-9}} transition={{duration:.24}} className="view">
            {liveState==="live" && <LivePortal tab={tab}/>}
            {liveState==="checking" && <div className="panel"><p>Conectando al historial privado…</p></div>}
            {liveState==="error" && <div className="panel"><h2>No se pudo iniciar Fitness</h2><p>La base de datos o el acceso protegido no están disponibles. No mostraremos datos ficticios como si fueran reales.</p></div>}
            {liveState==="demo" && tab==="home"&&<>
              <div className="intro"><span className="eyebrow">TU CENTRO DE ENTRENAMIENTO</span><h1>Tu salud en movimiento<span className="neon-dot">.</span></h1><p>Garmin registra la actividad. Aquí podrás comprenderla, ver tus rutinas y seguir tu evolución.</p></div>
              <div className="demo-banner"><Sparkles size={18}/><span><strong>Modo demostración.</strong> Todas las cifras y comidas son ficticias. Aún no existe conexión de datos reales con Garmin ni PostgreSQL.</span></div>
              <div className="metric-grid">
                <Metric icon={HeartPulse} label="Body Battery" value={selected.battery} unit="/100" accent/>
                <Metric icon={Moon} label="Calidad de sueño" value={selected.sleepScore} unit="/100"/>
                <Metric icon={Footprints} label="Pasos" value={selected.steps.toLocaleString("es-CL")}/>
                <Metric icon={Dumbbell} label="Actividad" value={selected.trainingMin} unit="min"/>
              </div>
              <div className="home-grid">
                <Card className="hero-card"><span className="eyebrow">SIGUIENTE SESIÓN · EJEMPLO</span><h2>Fuerza en casa</h2><p>6 ejercicios · 45–50 minutos · guía visual y cuidados siempre visibles.</p><div className="hero-orbit"><div className="orbit-ring"><strong>06</strong><span>Ejercicios</span></div></div><button type="button" className="neon-button" onClick={()=>go("workout")}>Ver rutina completa <ChevronRight size={18}/></button></Card>
                <Card className="trend-card"><div className="panel-heading"><div><span className="eyebrow">TENDENCIA · DEMO</span><h2>Recuperación</h2></div><Activity size={23}/></div><MetricPlot values={history.map(x=>x.battery)}/><p>Interpretación clínica o deportiva pendiente de datos reales.</p><button type="button" className="text-button" onClick={()=>go("progress")}>Explorar cruces de métricas <ChevronRight size={17}/></button></Card>
              </div>
            </>}

            {liveState==="demo" && tab==="workout"&&<>
              <div className="intro"><span className="eyebrow">RUTINA VISUAL COMPLETA</span><h1>Tu entrenamiento<span className="neon-dot">.</span></h1><p>Todos los ejercicios en una sola página. Técnica, errores y cuidados permanecen desplegados.</p></div>
              <div className="demo-banner"><Sparkles size={18}/><span>Rutina ilustrativa: no es necesariamente tu entrenamiento programado en Garmin. Las animaciones son esquemas pendientes de validación técnica específica.</span></div>
              <div className="row-wrap badges"><span className="chip lime">FUERZA EN CASA</span><span className="chip">{workout.length} ejercicios</span><span className="chip">45–50 min</span><span className="chip">Registro real en Forerunner 955</span></div>
              <div className="workout-tools"><div className="subtabs" role="group" aria-label="Filtrar rutina">{["Todos","Fuerza","Core","Cardio"].map(x=><button key={x} className={group===x?"selected":""} onClick={()=>setGroup(x)}>{x}</button>)}</div><div className="timer-box"><Timer size={17}/><strong>{String(Math.floor(timer/60)).padStart(2,"0")}:{String(timer%60).padStart(2,"0")}</strong><button aria-label={isRunning?"Pausar temporizador":"Iniciar temporizador"} onClick={()=>{if(timer===0)setTimer(60);setIsRunning(!isRunning);}}>{isRunning?<Pause size={17}/>:<Play size={17}/>}</button><button onClick={resetTimer}>Reiniciar</button></div></div>
              <div className="exercise-grid">{workout.filter(x=>group==="Todos"||group==="Fuerza"&&x.group==="Fuerza"||x.group===group).map((step,index)=><ExerciseCard key={step.id} step={step} index={index}/>)}</div>
              <Card className="hint-card"><Watch size={22}/><div><strong>Garmin sigue registrando el entrenamiento.</strong><p>Esta PWA es una guía visual; los datos efectivos se consultarán después de sincronizar el reloj. No registres las series dos veces.</p></div></Card>
            </>}

            {liveState==="demo" && tab==="food"&&<>
              <div className="intro"><span className="eyebrow">ALIMENTACIÓN</span><h1>Comidas registradas<span className="neon-dot">.</span></h1><p>Historial de solo lectura. En la versión conectada, todo se ingresará desde ChatGPT.</p></div>
              <div className="demo-banner"><Utensils size={18}/><span>Ejemplos ficticios para probar el diseño. Ninguna comida ha sido guardada desde esta aplicación.</span></div>
              <Card className="food-chat"><div className="food-chat-icon"><Sparkles size={24}/></div><div><h2>Cuéntame lo que comiste en ChatGPT</h2><p>Ejemplo: «Comí tres huevos enteros, una palta pequeña y un vaso de leche cultivada». Guardaremos porciones confirmadas y estimaciones por separado cuando esté habilitado el MCP de alimentación.</p></div></Card>
              <div className="food-list">{[...history].reverse().map(d=><Card key={d.date} className="food-day"><div className="panel-heading"><h3><FormatDate date={d.date}/></h3><span className="chip">DEMO</span></div><div>{d.meals.map((m,i)=><div key={i} className="food-line"><span className="food-dot"/><span>{m}</span></div>)}</div><div className="food-totals">{d.protein===null?"Información nutricional incompleta":d.protein+" g de proteína · "+d.foodKcal+" kcal estimadas"}</div></Card>)}</div>
            </>}

            {liveState==="demo" && tab==="history"&&<>
              <div className="intro"><span className="eyebrow">LÍNEA DE TIEMPO PERSONAL</span><h1>Histórico diario<span className="neon-dot">.</span></h1><p>Un día, una vista organizada: salud, ejercicio, alimentación y recuperación.</p></div>
              <div className="demo-banner"><CalendarDays size={18}/><span>Datos de muestra correspondientes a fechas ficticias; no reflejan tus registros personales de Garmin.</span></div>
              <Card className="date-card"><div className="date-control"><button aria-label="Día anterior" onClick={()=>changeDate(-1)} disabled={selectedDate===history[0].date}><ChevronLeft/></button><label htmlFor="selected-date"><span>Fecha seleccionada</span><input id="selected-date" type="date" value={selectedDate} min={history[0].date} max={history[history.length-1].date} onChange={e=>{if(history.some(d=>d.date===e.target.value))setSelectedDate(e.target.value);}}/></label><button aria-label="Día siguiente" onClick={()=>changeDate(1)} disabled={selectedDate===history[history.length-1].date}><ChevronRight/></button></div><div className="date-strip">{history.map(d=><button key={d.date} className={selected.date===d.date?"on":""} onClick={()=>setSelectedDate(d.date)}><small>{new Date(d.date+"T12:00:00").toLocaleDateString("es-CL",{weekday:"short"})}</small><strong>{d.date.slice(-2)}</strong><span className="date-dot"/></button>)}</div></Card>
              <div className="subtabs history-tabs" role="tablist" aria-label="Información por área">{detailTabs.map(x=><button role="tab" aria-selected={historyTab===x.id} key={x.id} className={historyTab===x.id?"selected":""} onClick={()=>setHistoryTab(x.id)}>{x.label}</button>)}</div>
              {(historyTab==="overview"||historyTab==="health")&&<div className="metric-grid">
                <Metric icon={Footprints} label="Pasos" value={selected.steps.toLocaleString("es-CL")}/>
                <Metric icon={HeartPulse} label="Body Battery" value={selected.battery} unit="/100" accent/>
                <Metric icon={Activity} label="Estrés" value={selected.stress}/>
                <Metric icon={Moon} label="Sueño" value={selected.sleep} unit="h"/>
              </div>}
              {(historyTab==="health"||historyTab==="recovery"||historyTab==="overview")&&<Card className="history-card"><h2><HeartPulse size={21}/> Salud y recuperación</h2><div className="detail-grid">{[["Puntuación de sueño",selected.sleepScore+"/100"],["VFC media",selected.hrv+" ms"],["Frecuencia cardiaca en reposo",selected.restingHR+" lpm"],["Body Battery",selected.battery+"/100"],["Estrés",String(selected.stress)],["Horas dormidas",selected.sleep+" h"]].map(([key,val])=><div key={key}><span>{key}</span><strong>{val}</strong></div>)}</div></Card>}
              {(historyTab==="activity"||historyTab==="overview")&&<Card className="history-card"><h2><Dumbbell size={21}/> Ejercicio</h2><div className="detail-grid"><div><span>Sesión registrada (ejemplo)</span><strong>{selected.training}</strong></div><div><span>Duración</span><strong>{selected.trainingMin} min</strong></div><div><span>Calorías activas estimadas</span><strong>{selected.activeKcal} kcal</strong></div><div><span>Pasos</span><strong>{selected.steps.toLocaleString("es-CL")}</strong></div></div></Card>}
              {(historyTab==="food"||historyTab==="overview")&&<Card className="history-card"><h2><Utensils size={21}/> Alimentación</h2><ul className="food-history">{selected.meals.map((m,i)=><li key={i}>{m}</li>)}</ul><p className="muted">{selected.protein===null?"Sin datos nutricionales completos":selected.protein+" g proteína / "+selected.foodKcal+" kcal estimadas"}</p></Card>}
            </>}

            {liveState==="demo" && tab==="progress"&&<>
              <div className="intro"><span className="eyebrow">ANÁLISIS MULTIVARIABLE</span><h1>Progreso inteligente<span className="neon-dot">.</span></h1><p>16 comparaciones de entre 2 y 4 métricas para descubrir patrones, no solo cifras aisladas.</p></div>
              <div className="demo-banner"><Sparkles size={18}/><span>Los gráficos son muestras visuales, no resultados analíticos reales. Los comentarios personalizados llegarán cuando existan datos longitudinales suficientes.</span></div>
              <div className="metric-grid">
                <Metric icon={Dumbbell} label="Entrenamientos / muestra" value={history.filter(d=>d.trainingMin>0).length}/>
                <Metric icon={Moon} label="Sueño promedio / muestra" value={(history.reduce((a,d)=>a+d.sleep,0)/history.length).toFixed(1)} unit="h"/>
                <Metric icon={HeartPulse} label="Body Battery medio" value={Math.round(history.reduce((a,d)=>a+d.battery,0)/history.length)}/>
                <Metric icon={Utensils} label="Días con nutrición" value={history.filter(d=>d.protein!==null).length} unit="/7"/>
              </div>
              <div className="panel analysis-panel"><div className="panel-heading"><div><span className="eyebrow">EXPLORADOR DE CRUCES</span><h2>Elige un análisis</h2></div><span className="chip lime">16 opciones</span></div>
                <div className="subtabs" role="group" aria-label="Cantidad de métricas">{([["all","Todos"],["2","2 métricas"],["3","3 métricas"],["4","4 métricas"]] as const).map(([id,label])=><button className={crossSize===id?"selected":""} key={id} onClick={()=>{setCrossSize(id);const first=crosses.findIndex(x=>id==="all"||x.metrics.length===Number(id));if(first>=0)setCross(first);}}>{label}</button>)}</div>
                <div className="cross-options">{visibleCrosses.map(x=><button key={x.i} className={"cross-button "+(shownCross.i===x.i?"active":"")} onClick={()=>setCross(x.i)}><span className="cross-num">{String(x.i+1).padStart(2,"0")}</span>{x.title}<small>{x.metrics.length} variables</small></button>)}</div>
                <div className="cross-detail"><span className="eyebrow">COMPARACIÓN SELECCIONADA · SIMULACIÓN</span><h3>{shownCross.title}</h3><div className="row-wrap">{shownCross.metrics.map(m=><span className="chip" key={m}>{m}</span>)}</div><MetricPlot values={history.map(d=>demoValue(d,shownCross.metrics[0]))} stroke="#b8ff17"/><p>{shownCross.desc}</p><div className="safety"><ShieldCheck size={18}/><span>Las asociaciones visuales no prueban causalidad. El análisis real controlará datos incompletos, duración del período y variaciones de esfuerzo.</span></div></div>
              </div>
            </>}

            {liveState==="demo" && tab==="catalog"&&<>
              <div className="intro"><span className="eyebrow">BIBLIOTECA DE EJERCICIOS</span><h1>Catálogo Garmin<span className="neon-dot">.</span></h1><p>Explora ejercicios mediante sus identificadores Garmin y filtra por categoría, músculo y equipamiento.</p></div>
              <div className="demo-banner"><BookOpen size={18}/><span>Muestra de {exerciseCatalog.length} fichas verificadas del catálogo Garmin (1.531 entradas consultables en el MCP). La integración dinámica completa se incorporará después.</span></div>
              <Card className="catalog-controls">
                <div className="search-input"><Search size={19}/><input aria-label="Buscar ejercicios" placeholder="Buscar ejercicios o códigos Garmin…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
                <div className="filter-grid"><label>Categoría<select value={category} onChange={e=>setCategory(e.target.value)}>{["Todos",...categories].map(c=><option key={c}>{c}</option>)}</select></label><label>Músculo<select value={muscle} onChange={e=>setMuscle(e.target.value)}>{["Todos",...muscles].map(c=><option key={c}>{c}</option>)}</select></label><label>Equipamiento<select value={equipment} onChange={e=>setEquipment(e.target.value)}>{["Todos",...equipments].map(c=><option key={c}>{c}</option>)}</select></label></div>
                <span className="muted results-count">{filtered.length} ejercicios mostrados</span>
              </Card>
              <div className="catalog-grid">{filtered.map(e=><Card key={e.category+e.code} className="catalog-card"><div className="row-wrap"><span className="chip lime">{e.category}</span><span className="chip">{e.muscle}</span></div><h3>{e.name}</h3><p className="muted">{e.nameEn}</p><ExerciseVisual kind={e.visual} label={e.name}/><div className="catalog-pills"><span>{e.equipment}</span><span>{e.code}</span></div><div className="catalog-guide"><h4><CheckCircle2 size={17}/> Cómo realizarlo</h4><p>Requiere guía específica validada para esta variante. Consulta el nombre Garmin y la ficha técnica antes de realizarla.</p><h4 className="warning"><AlertTriangle size={17}/> Errores y cuidados</h4><p>Los esquemas visuales agrupan movimientos similares; no sustituyen una demostración particular ni indican una técnica exacta.</p></div></Card>)}</div>
              {filtered.length===0&&<Card><p>No hay coincidencias con los filtros seleccionados.</p></Card>}
            </>}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>

    <nav className="bottom-nav" aria-label="Navegación móvil">{sections.map(({id,label,icon:Icon})=><button type="button" key={id} className={tab===id?"active":""} aria-current={tab===id?"page":undefined} onClick={()=>go(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>
  </div>;
}

export default App;
