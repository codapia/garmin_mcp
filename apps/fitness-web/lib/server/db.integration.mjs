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
  console.log("Fitness PostgreSQL migrations/idempotency OK");
}finally{await pool.end();}
