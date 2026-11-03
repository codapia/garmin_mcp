import {strict as assert} from "node:assert";
import {test} from "node:test";
import {stepDurationSeconds,formatDurationSeconds,formatStepDuration,timedStepBreakdown} from "./workout-duration.ts";

const steps=[
  {name:"Bicicleta suave de calentamiento",source_garmin_sport:"cycling",duration_min:5,duration_seconds:300},
  {name:"Movilidad dinámica inicial",category:"mobility",duration_min:2,duration_seconds:120},
  {name:"Sentadilla goblet",sets:3,reps:10,weight_kg:6,rest_seconds:60},
  {name:"Bicicleta final fácil",source_garmin_sport:"cycling",duration_min:8,duration_seconds:480},
  {name:"Movilidad y respiración final",category:"mobility",duration_min:5,duration_seconds:300}
];

test("show exact minutes for cycling warmup, mobility and cooldown",()=>{
  assert.equal(formatStepDuration(steps[0]),"5 min");
  assert.equal(formatStepDuration(steps[1]),"2 min");
  assert.equal(formatStepDuration(steps[3]),"8 min");
  assert.equal(formatStepDuration(steps[4]),"5 min");
  assert.equal(timedStepBreakdown(steps),"Bicicleta 13 min · Movilidad 7 min");
});
test("use seconds when both duration fields exist, with minute fallback",()=>{
  assert.equal(stepDurationSeconds({duration_seconds:90,duration_min:2}),90);
  assert.equal(formatStepDuration({duration_seconds:90,duration_min:2}),"1 min 30 s");
  assert.equal(formatStepDuration({duration_min:3.5}),"3 min 30 s");
  assert.equal(formatDurationSeconds(45),"45 s");
  assert.equal(formatStepDuration({sets:3,reps:10}),null);
});
test("do not turn missing or invalid durations into zero-minute workouts",()=>{
  assert.equal(stepDurationSeconds({duration_seconds:0,duration_min:0}),null);
  assert.equal(stepDurationSeconds({duration_seconds:"300",duration_min:"5"}),null);
  assert.equal(stepDurationSeconds({duration_min:-3}),null);
  assert.equal(stepDurationSeconds({duration_seconds:Infinity}),null);
  assert.equal(timedStepBreakdown([{name:"Press inclinado",sets:3,reps:10}]),"");
});
