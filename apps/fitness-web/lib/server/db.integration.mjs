import assert from "node:assert/strict";
import fs from "node:fs/promises";
import pg from "pg";
const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
try{
  await pool.query(await fs.readFile(new URL("../../db/001-schema.sql",import.meta.url),"utf8"));
  const meal=await pool.query("INSERT INTO fitness_meals(occurred_on,meal_type,description,protein_g,protein_estimated,external_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",["2026-10-28","desayuno","Prueba 3 huevos",18,true,"ci-fitness-meal"]);
  assert.equal(meal.rowCount,1);
  await pool.query("INSERT INTO fitness_meals(occurred_on,meal_type,description,external_id) VALUES($1,$2,$3,$4) ON CONFLICT (external_id) WHERE external_id IS NOT NULL DO UPDATE SET id=fitness_meals.id",["2026-10-28","desayuno","Prueba 3 huevos","ci-fitness-meal"]);
  const count=await pool.query("SELECT count(*)::int AS n FROM fitness_meals WHERE external_id=$1",["ci-fitness-meal"]);
  assert.equal(count.rows[0].n,1);
  await pool.query("DELETE FROM fitness_meals WHERE external_id=$1",["ci-fitness-meal"]);
  // Load editing changes only the local fitness_plans JSONB copy, preserving Garmin identifiers.
  const plan=await pool.query("INSERT INTO fitness_plans(planned_on,title,steps) VALUES($1,$2,$3::jsonb) RETURNING id,version",
    ["2026-11-01","CI Test Planned Load",JSON.stringify([{name:"Sentadilla goblet",source_garmin_workout_id:1747850455,reps:10}])]);
  const id=plan.rows[0].id;
  try{
    const sql=`UPDATE fitness_plans
      SET steps=jsonb_set(steps,ARRAY[$2::text],
        (steps -> $2::integer) || jsonb_build_object('fitness_load_kg',$3::numeric,'fitness_load_scope',$4::text,'fitness_load_source','fitness_manual','fitness_load_status','planned'),false),
        version=version+1,updated_at=now()
      WHERE id=$1::uuid AND jsonb_array_length(steps)>$2::integer AND version=$5::integer
      RETURNING version,steps`;
    const updated=await pool.query(sql,[id,0,6,"per_hand",1]);
    assert.equal(updated.rowCount,1);
    assert.equal(updated.rows[0].version,2);
    assert.equal(updated.rows[0].steps[0].fitness_load_kg,6);
    assert.equal(updated.rows[0].steps[0].source_garmin_workout_id,1747850455);
    const stale=await pool.query(sql,[id,0,8,"total",1]);
    assert.equal(stale.rowCount,0);
  }finally{await pool.query("DELETE FROM fitness_plans WHERE id=$1",[id]);}
  console.log("Fitness PostgreSQL schema/idempotency/planned kg OK");
}finally{await pool.end();}
