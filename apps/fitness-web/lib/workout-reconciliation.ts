/**
 * Truthfulness boundary: a Garmin workout scheduled for a day is not evidence
 * that it was performed. Only activity records with a real Garmin activity ID
 * can be displayed as completed training.
 */
export type GarminExerciseDay = {date:string; activities:unknown; sync_warnings?:string[]};
export type GarminActivity = {
  id:string; date:string; name:string; type:string;
  duration_seconds:number|null; calories:number|null;
  avg_hr_bpm:number|null; max_hr_bpm:number|null;
  workout_id:string|null;
};
export type FitnessPlanForReconciliation = {
  id:string; date:string; title:string; steps:Record<string,unknown>[];
  garmin_workout_id:string|null;
};

const record=(value:unknown):Record<string,unknown> =>
  value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const str=(x:unknown):string=>typeof x==="string"?x:"";
const positiveId=(x:unknown):string=>
  (typeof x==="string"&&/^\d+$/.test(x))||(typeof x==="number"&&Number.isSafeInteger(x)&&x>0)?String(x):"";
const value=(x:unknown):number|null=>typeof x==="number"&&Number.isFinite(x)?x:null;
const normalized=(x:string):string=>x.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/^importada de garmin\s*[·|:-]?\s*/,"")
  .replace(/[^a-z0-9]+/g," ").trim();

export function activitiesFromGarmin(days:GarminExerciseDay[]):GarminActivity[]{
  const result:GarminActivity[]=[];
  const seen=new Set<string>();
  for(const day of days){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day.date))continue;
    const raw=record(day.activities).activities;
    if(!Array.isArray(raw))continue;
    for(const entry of raw){
      const obj=record(entry),id=positiveId(obj.id??obj.activityId??obj.activity_id);
      if(!id||seen.has(id))continue;
      seen.add(id);
      result.push({
        id,date:day.date,
        name:str(obj.name)||"Actividad Garmin #"+id,
        type:str(obj.type)||str(obj.activityType)||"other",
        duration_seconds:value(obj.duration_seconds??obj.duration),
        calories:value(obj.calories),
        avg_hr_bpm:value(obj.avg_hr_bpm),
        max_hr_bpm:value(obj.max_hr_bpm),
        workout_id:positiveId(obj.workout_id??obj.workoutId??record(obj.workout).workoutId)||null,
      });
    }
  }
  return result;
}

export function planConfirmedByGarmin(plan:FitnessPlanForReconciliation,activities:GarminActivity[]):boolean{
  const refs=new Set<string>([
    plan.garmin_workout_id||"",
    ...plan.steps.flatMap(step=>[
      positiveId(step.source_garmin_workout_id),
      positiveId(step.garmin_workout_id)
    ])
  ].filter(Boolean));
  const planName=normalized(plan.title);
  return activities.some(activity=>{
    if(activity.date!==plan.date)return false;
    if(activity.workout_id&&refs.has(activity.workout_id))return true;
    const activityName=normalized(activity.name);
    // Garmin truncates names on some devices; require a substantial exact
    // prefix, never assume an activity completed merely because its sport matches.
    return activityName.length>=12&&(planName===activityName||
      planName.startsWith(activityName)||
      (planName.length>=12&&activityName.startsWith(planName)));
  });
}

export function visibleWorkoutPlans<T extends FitnessPlanForReconciliation>(
  plans:T[], activities:GarminActivity[], today:string
):T[]{
  return plans.filter(plan=>plan.date>=today||planConfirmedByGarmin(plan,activities));
}

export function pendingWorkoutPlans<T extends FitnessPlanForReconciliation>(
  plans:T[], activities:GarminActivity[], today:string
):T[]{
  return plans.filter(plan=>plan.date>=today&&!planConfirmedByGarmin(plan,activities));
}

export function hasSyncedActivityData(day:GarminExerciseDay|undefined):boolean{
  return !!day&&Array.isArray(record(day.activities).activities);
}
