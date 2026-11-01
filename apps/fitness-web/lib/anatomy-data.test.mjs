import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const data=[];
for (let i=0;i<4;i++){
  const part=JSON.parse(await readFile(new URL("../public/anatomy-data/part-"+i+".json",import.meta.url),"utf8"));
  assert(Array.isArray(part));
  data.push(...part);
}
assert.equal(data.length,1324);
assert.equal(new Set(data.map(x=>x.id)).size,1324);
for(const item of data){
  assert(typeof item.target==="string");
  assert(Array.isArray(item.instructions_es));
  assert(!("gif_url" in item));
  assert(!("image" in item));
}
console.log("Anatomy records verified; no third-party GIFs copied.");
