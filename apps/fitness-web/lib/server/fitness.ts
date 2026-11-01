import "server-only";
import { db } from "./db";
import { fetchGarminDay } from "./garmin";

export function validDay(date:unknown):date is string {
  if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const d=new Date(date+"T12:00:00Z");
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10)===date;
}
function object(x:unknown):Record<string,unknown>{return x&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:{}}
function textField(x:unknown,limit=1000):string {
  if(typeof x!=="string"||x.trim().length<2||x.length>limit)throw new Error("Texto inválido");
  return x.trim();
}
function optionalNumber(x:unknown,max:number):number|null{
  if(x===null||x===undefined)return null;
  if(typeof x!=="number"||!Number.isFinite(x)||x<0||x>max)throw new Error("Valor numérico inválido");
  return x;
}
export async function saveMeal(payload:unknown){
  const p=object(payload);
  if(!validDay(p.date))throw new Error("Fecha de comida inválida");
  const mealType=p.meal_type??"otro";
  if(!["desayuno","almuerzo","cena","colacion","otro"].includes(String(mealType)))throw new Error("Tipo de comida inválido");
  const portions=Array.isArray(p.portions)?p.portions:[];
  if(JSON.stringify(portions).length>5000)throw new Error("Porciones demasiado extensas");
  const externalId=p.external_id==null?null:textField(p.external_id,150);
  const q=await db().query(
    `INSERT INTO fitness_meals(occurred_on,meal_type,description,portions,calories,protein_g,calories_estimated,protein_estimated,external_id,notes)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (external_id) WHERE external_id IS NOT NULL DO UPDATE SET id=fitness_meals.id
     RETURNING id,occurred_on,meal_type,description,calories,protein_g,calories_estimated,protein_estimated,created_at`,
    [p.date,mealType,textField(p.description,2000),JSON.stringify(portions),
    optionalNumber(p.calories,10000),optionalNumber(p.protein_g,1000),
    p.calories_estimated!==false,p.protein_estimated!==false,externalId,
    typeof p.notes==="string"?p.notes.slice(0,1500):null]
  );
  return q.rows[0];
}
export async function listMeals(start:string,end:string){
  if(!validDay(start)||!validDay(end)||start>end)throw new Error("Rango de fechas inválido");
  const q=await db().query("SELECT id,occurred_on::text AS date,meal_type,description,portions,calories,protein_g,calories_estimated,protein_estimated,source,notes,created_at FROM fitness_meals WHERE occurred_on BETWEEN $1 AND $2 ORDER BY occurred_on DESC,created_at DESC LIMIT 500",[start,end]);
  return q.rows;
}
export async function listPlans(start:string,end:string){
  if(!validDay(start)||!validDay(end)||start>end)throw new Error("Rango de fechas inválido");
  return (await db().query("SELECT id,planned_on::text AS date,title,steps,garmin_workout_id,version,updated_at FROM fitness_plans WHERE planned_on BETWEEN $1 AND $2 ORDER BY planned_on DESC,updated_at DESC LIMIT 100",[start,end])).rows;
}
export async function savePlan(payload:unknown){
  const p=object(payload);
  if(!validDay(p.date))throw new Error("Fecha de rutina inválida");
  const steps=p.steps;
  if(!Array.isArray(steps)||steps.length<1||steps.length>40||JSON.stringify(steps).length>30000)
    throw new Error("Pasos de rutina inválidos");
  if(!steps.every(x=>x&&typeof x==="object"&&typeof x.name==="string"&&x.name.length<150))
    throw new Error("Cada ejercicio debe incluir un nombre válido");
  const title=textField(p.title,200);
  if(p.id){
    if(typeof p.id!=="string"||!/^[0-9a-f-]{36}$/.test(p.id)||!Number.isInteger(p.expected_version))
      throw new Error("Para editar se exige ID y expected_version");
    const result=await db().query(`UPDATE fitness_plans SET planned_on=$1,title=$2,steps=$3::jsonb,
      version=version+1,updated_at=now() WHERE id=$4 AND version=$5 AND garmin_workout_id IS NULL
      RETURNING id,planned_on::text AS date,title,steps,version`,
      [p.date,title,JSON.stringify(steps),p.id,p.expected_version]);
    if(!result.rows.length)throw new Error("No se modificó: versión cambiada, plan inexistente o ya enviado a Garmin. Crea un nuevo plan para modificar una rutina enviada.");
    return result.rows[0];
  }
  // Serialise identical requests so retrying an MCP write does not create duplicate plans.
  const client=await db().connect();
  try{
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[p.date+"|"+title]);
    const previous=await client.query(`SELECT id,planned_on::text AS date,title,steps,version,garmin_workout_id
      FROM fitness_plans WHERE planned_on=$1 AND title=$2 AND steps=$3::jsonb
      ORDER BY created_at ASC LIMIT 1`,[p.date,title,JSON.stringify(steps)]);
    if(previous.rows.length){await client.query("COMMIT");return previous.rows[0];}
    const inserted=await client.query(`INSERT INTO fitness_plans(planned_on,title,steps) VALUES($1,$2,$3::jsonb)
      RETURNING id,planned_on::text AS date,title,steps,version,garmin_workout_id`,
      [p.date,title,JSON.stringify(steps)]);
    await client.query("COMMIT");
    return inserted.rows[0];
  }catch(e){await client.query("ROLLBACK").catch(()=>{});throw e;}
  finally{client.release();}
}
/**
 * Update a FITNESS-local planned load only. The original Garmin workout is
 * never edited, replaced, rescheduled, or sent by this operation.
 * The plan version guards concurrent edits from separate browser tabs.
 */
export async function saveExerciseLoad(payload:unknown){
  const p=object(payload);
  if(typeof p.plan_id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.plan_id))
    throw new Error("Identificador de plan inválido");
  if(!Number.isInteger(p.expected_version)||!Number.isInteger(p.step_index)||
     (p.step_index as number)<0||(p.step_index as number)>=40)
    throw new Error("Versión o ejercicio inválido");
  if(typeof p.kg!=="number"||!Number.isFinite(p.kg)||p.kg<0||p.kg>100)
    throw new Error("La carga debe estar entre 0 y 100 kg");
  if(p.scope!=="total"&&p.scope!=="per_hand")
    throw new Error("Selecciona carga total o por mano");
  const q=await db().query(`
    UPDATE fitness_plans
    SET steps=jsonb_set(steps,ARRAY[$2::text],
      (steps -> $2::integer) || jsonb_build_object(
        'fitness_load_kg',$3::numeric,'fitness_load_scope',$4::text,
        'fitness_load_source','fitness_manual','fitness_load_status','planned'
      ),false),
      version=version+1,updated_at=now()
    WHERE id=$1::uuid AND jsonb_array_length(steps)>$2::integer AND version=$5::integer
    RETURNING id,version,steps
  `,[p.plan_id,p.step_index,p.kg,p.scope,p.expected_version]);
  if(!q.rows.length)throw new Error("La rutina cambió en otra sesión. Actualiza Fitness y vuelve a intentarlo.");
  return {id:q.rows[0].id,version:q.rows[0].version,step_index:p.step_index,kg:p.kg,scope:p.scope};
}

export async function storeGarminDay(date:string){
  if(!validDay(date))throw new Error("Fecha inválida");
  const d=await fetchGarminDay(date);
  const result=await db().query(`INSERT INTO fitness_garmin_days(day,daily_stats,sleep,hrv,readiness,activities,scheduled_workouts,sync_warnings)
    VALUES($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb)
    ON CONFLICT (day) DO UPDATE SET daily_stats=COALESCE(EXCLUDED.daily_stats,fitness_garmin_days.daily_stats),
      sleep=COALESCE(EXCLUDED.sleep,fitness_garmin_days.sleep),hrv=COALESCE(EXCLUDED.hrv,fitness_garmin_days.hrv),
      readiness=COALESCE(EXCLUDED.readiness,fitness_garmin_days.readiness),
      activities=COALESCE(EXCLUDED.activities,fitness_garmin_days.activities),
      scheduled_workouts=COALESCE(EXCLUDED.scheduled_workouts,fitness_garmin_days.scheduled_workouts),
      sync_warnings=EXCLUDED.sync_warnings,synced_at=now()
    RETURNING day::text AS date,synced_at,sync_warnings`,
    [date,...["daily_stats","sleep","hrv","readiness","activities","scheduled_workouts"].map(k=>{const value=(d as Record<string,unknown>)[k];return value==null?null:JSON.stringify(value);}),
      JSON.stringify(d.warnings)]);
  return result.rows[0];
}
export async function getTimeline(start:string,end:string){
  if(!validDay(start)||!validDay(end)||start>end)throw new Error("Rango inválido");
  const days=(await db().query(`SELECT day::text AS date,daily_stats,sleep,hrv,readiness,activities,
    scheduled_workouts,sync_warnings,synced_at FROM fitness_garmin_days
    WHERE day BETWEEN $1 AND $2 ORDER BY day ASC LIMIT 120`,[start,end])).rows;
  const [meals,plans]=await Promise.all([listMeals(start,end),listPlans(start,end)]);
  return {days,meals,plans};
}
