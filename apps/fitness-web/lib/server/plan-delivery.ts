import "server-only";
import { db } from "./db";
import { callGarminTool } from "./garmin";

type Step = {name: string; category: string; exercise_name: string; sets: number; reps: number; rest_seconds?: number; weight_kg?: number};
type Stored = {id:string; date:string; title:string; steps:Step[]; version:number; garmin_workout_id:string|null};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noTarget={workoutTargetTypeId:1,workoutTargetTypeKey:"no.target"};
function positiveInteger(value:unknown,min:number,max:number):value is number {
  return typeof value==="number"&&Number.isInteger(value)&&value>=min&&value<=max;
}
function normalizeSteps(value:unknown):Step[]{
  if(!Array.isArray(value)||!value.length||value.length>40)throw new Error("Plan sin ejercicios válidos");
  return value.map((raw:unknown,i:number)=>{
    if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("Paso "+(i+1)+" inválido");
    const s=raw as Record<string,unknown>;
    if(typeof s.name!=="string"||!s.name.trim()||typeof s.category!=="string"||
      typeof s.exercise_name!=="string"||!(/^[A-Z0-9_]+$/).test(s.category)||
      !(/^[A-Z0-9_]+$/).test(s.exercise_name))throw new Error("El ejercicio "+(i+1)+" necesita códigos oficiales category y exercise_name de Garmin");
    if(!positiveInteger(s.sets,1,12)||!positiveInteger(s.reps,1,150))throw new Error("Series o repeticiones inválidas en "+s.name);
    const rest=s.rest_seconds??60;
    if(!positiveInteger(rest,1,600))throw new Error("Descanso inválido en "+s.name);
    const weight=s.weight_kg;
    if(weight!==undefined&&(typeof weight!=="number"||!Number.isFinite(weight)||weight<0||weight>200))
      throw new Error("Peso inválido en "+s.name);
    return {name:s.name,category:s.category,exercise_name:s.exercise_name,sets:s.sets,reps:s.reps,rest_seconds:rest,...(weight!==undefined?{weight_kg:weight}:{})} as Step;
  });
}
export function toGarminWorkout(title:string,steps:Step[]){
  let next=0;
  const units={unitId:8,unitKey:"kilogram",factor:1000.0};
  const workoutSteps=steps.map(step=>{
    const repetitions=step.sets;
    const groupOrder=++next;
    const work={
      type:"ExecutableStepDTO",stepOrder:++next,
      stepType:{stepTypeId:3,stepTypeKey:"interval"},description:step.name,
      endCondition:{conditionTypeId:10,conditionTypeKey:"reps"},endConditionValue:step.reps,
      targetType:noTarget,category:step.category,exerciseName:step.exercise_name,
      ...(step.weight_kg!==undefined?{weightValue:step.weight_kg,weightUnit:units}:{})
    };
    const recovery={
      type:"ExecutableStepDTO",stepOrder:++next,
      stepType:{stepTypeId:5,stepTypeKey:"rest"},description:"Descanso",
      endCondition:{conditionTypeId:2,conditionTypeKey:"time"},endConditionValue:step.rest_seconds??60,
      targetType:noTarget
    };
    return {type:"RepeatGroupDTO",stepOrder:groupOrder,stepType:{stepTypeId:6,stepTypeKey:"repeat"},
      numberOfIterations:repetitions,smartRepeat:false,
      endCondition:{conditionTypeId:7,conditionTypeKey:"iterations"},endConditionValue:repetitions,
      workoutSteps:[work,recovery]};
  });
  const sportType={sportTypeId:5,sportTypeKey:"strength_training"};
  return {workoutName:title,sportType,workoutSegments:[{segmentOrder:1,sportType,workoutSteps}]};
}
function garminResult(x:unknown):Record<string,unknown>{
  if(!x||typeof x!=="object"||Array.isArray(x))throw new Error("Respuesta Garmin inesperada; revise la biblioteca antes de reintentar");
  return x as Record<string,unknown>;
}
export async function sendPlanToGarmin(planId:string,expectedVersion:number){
  if(!uuid.test(planId)||!positiveInteger(expectedVersion,1,1000000))throw new Error("ID o versión inválidos");
  const client=await db().connect();
  let row:Stored;
  let workoutId:string|null=null;
  try{
    await client.query("BEGIN");
    const q=await client.query<Stored>(
      "SELECT id, planned_on::text AS date, title, steps, version, garmin_workout_id FROM fitness_plans WHERE id=$1 FOR UPDATE",
      [planId]);
    if(!q.rows.length)throw new Error("Plan no encontrado");
    row=q.rows[0];
    if(row.version!==expectedVersion)throw new Error("La rutina cambió: actualiza la página antes de enviarla");
    workoutId=row.garmin_workout_id;
    if(!workoutId){
      const exercises=normalizeSteps(row.steps);
      const check=garminResult(await callGarminTool("validate_strength_exercises",{exercises:exercises.map(s=>({category:s.category,name:s.exercise_name,sets:s.sets,reps:s.reps,rest_seconds:s.rest_seconds}))}));
      if(check.valid!==true)throw new Error("Los códigos de ejercicios no están validados por Garmin");
      const uploaded=garminResult(await callGarminTool("upload_workout",{workout_data:toGarminWorkout(row.title,exercises)}));
      if(uploaded.status!=="success"||!positiveInteger(uploaded.workout_id,1,Number.MAX_SAFE_INTEGER))
        throw new Error("Garmin no confirmó la creación. Verifica su biblioteca antes de reintentar.");
      workoutId=String(uploaded.workout_id);
      await client.query("UPDATE fitness_plans SET garmin_workout_id=$1,updated_at=now() WHERE id=$2",[workoutId,planId]);
    }
    await client.query("COMMIT");
  } catch(e){
    await client.query("ROLLBACK").catch(()=>{});
    throw e;
  } finally {client.release();}
  // The ID is persisted BEFORE scheduling: a failed scheduling retry will not upload duplicates.
  const scheduled=garminResult(await callGarminTool("schedule_workout",{workout_id:Number(workoutId),calendar_date:row!.date}));
  if(scheduled.status!=="success")throw new Error("Rutina creada en Garmin (#"+workoutId+"), pero no programada: "+String(scheduled.message||"Error de calendario")+". Reintenta desde Fitness sin duplicarla.");
  return {id:row!.id,garmin_workout_id:workoutId,scheduled_date:row!.date,status:"scheduled"};
}
