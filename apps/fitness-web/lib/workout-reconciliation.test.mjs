import {strict as assert} from "node:assert";
import {test} from "node:test";
import {activitiesFromGarmin,planConfirmedByGarmin,visibleWorkoutPlans,pendingWorkoutPlans,hasSyncedActivityData} from "./workout-reconciliation.ts";

const days=[
  {date:"2026-10-28",activities:{activities:[{id:24879172867,name:"Mie 28-10 | 30min suave | BB14 |",type:"strength_training",duration_seconds:925}]}},
  {date:"2026-10-29",activities:{activities:[{id:24891651852,name:"Jue 29-10 | Fuerza 35 min | Casa",type:"strength_training",duration_seconds:2104}]}},
  {date:"2026-10-30",activities:{count:0,activities:[]}},
  {date:"2026-10-31",activities:{activities:[{id:24917590728,name:"Sab 31-10 | Tren superior | Banc",type:"strength_training"}]}},
  {date:"2026-11-01",activities:{count:0,activities:[]}},
  {date:"2026-11-02",activities:{count:1,activities:[{id:24937194526,name:"Lun 02-11 | Bici muy suave | 30",type:"indoor_cycling",duration_seconds:1869.227,calories:168,avg_hr_bpm:120}]}}
];
const plan=(id,date,title,ref)=>({
  id,date,title,steps:[{name:"Ejercicio",source_garmin_workout_id:ref}],garmin_workout_id:null
});
const plans=[
  plan("not-executed","2026-11-01","Importada de Garmin · Dom 01-11 | Piernas y core moderado | Casa",1747850455),
  plan("completed","2026-11-02","Lun 02-11 | Bici muy suave | 30 min",1749550383),
  plan("pending","2026-11-03","Mar 03-11 | Fuerza ligera",1800000000)
];
test("actual training comes from Garmin activity IDs, not scheduled workouts",()=>{
  const activities=activitiesFromGarmin(days);
  assert.equal(activities.length,4);
  assert.equal(activities.filter(a=>a.date==="2026-11-01").length,0);
  assert.equal(activities.find(a=>a.date==="2026-11-02").id,"24937194526");
  assert.equal(hasSyncedActivityData(days[4]),true);
  assert.equal(hasSyncedActivityData({date:"2026-10-27",activities:null}),false);
  assert.equal(activitiesFromGarmin([{date:"2026-11-01",activities:{activities:[{name:"Entrenamiento programado sin ID"}]}}]).length,0);
});
test("Sunday scheduled strength never counts as performed",()=>{
  const activities=activitiesFromGarmin(days);
  assert.equal(planConfirmedByGarmin(plans[0],activities),false);
  assert.equal(planConfirmedByGarmin(plans[1],activities),true);
  assert.deepEqual(visibleWorkoutPlans(plans,activities,"2026-11-02").map(p=>p.id),["completed","pending"]);
  assert.deepEqual(pendingWorkoutPlans(plans,activities,"2026-11-02").map(p=>p.id),["pending"]);
});
test("unrelated activity same day cannot falsely complete another plan",()=>{
  const activities=activitiesFromGarmin(days);
  const unrelated=plan("different","2026-11-02","Lun 02-11 | Sentadillas",12345);
  assert.equal(planConfirmedByGarmin(unrelated,activities),false);
});
test("historical matching accepts device-truncated names and Garmin workout ID",()=>{
  const activity=activitiesFromGarmin(days).find(a=>a.date==="2026-11-02");
  assert.equal(planConfirmedByGarmin(plans[1],[activity]),true);
  const usingId={...activity,name:"Bici indoor",workout_id:"1749550383"};
  assert.equal(planConfirmedByGarmin(plans[1],[usingId]),true);
});
