import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import {join} from "node:path";

const file=join(process.cwd(),"public/data/exercises-dataset-mit.json");
const exercises=JSON.parse(readFileSync(file,"utf8"));
assert.equal(exercises.length,1324,"The full MIT-licensed dataset must be present");
assert.equal(new Set(exercises.map(x=>x.id)).size,exercises.length,"Exercise IDs must be unique");
for(const exercise of exercises){
  assert.equal(typeof exercise.id,"string");
  assert.equal(typeof exercise.n,"string");
  assert.equal(typeof exercise.c,"string");
  assert.equal(typeof exercise.e,"string");
  assert.equal(typeof exercise.t,"string");
  assert.equal(typeof exercise.es,"string");
  assert.ok(exercise.es.length>0,"Spanish instructions expected for "+exercise.id);
  assert.ok(Array.isArray(exercise.s));
  for(const forbidden of ["gif_url","image","media_id","attribution","video","url","src"]){
    assert.ok(!(forbidden in exercise),"Restricted media metadata must not ship: "+forbidden);
  }
}
assert.ok(exercises.some(e=>e.n.toLowerCase().includes("bench press")),"Bench press exercises");
assert.ok(exercises.some(e=>e.e==="dumbbell"),"Dumbbell exercises");
assert.ok(exercises.some(e=>e.e==="stationary bike"),"Stationary bike exercises");
console.log("Exercises Dataset: 1324 metadata records, Spanish instructions and no third-party media");
