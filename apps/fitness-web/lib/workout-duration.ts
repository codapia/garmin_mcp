/**
 * Duration-backed steps are time-based activities, not strength sets.
 * Read structured plan fields instead of guessing minutes from instructions.
 */
export function stepDurationSeconds(step:Record<string,unknown>):number|null{
  const seconds=step.duration_seconds;
  if(typeof seconds==="number"&&Number.isFinite(seconds)&&seconds>0&&seconds<=86400)
    return Math.round(seconds);
  const minutes=step.duration_min;
  if(typeof minutes==="number"&&Number.isFinite(minutes)&&minutes>0&&minutes<=1440)
    return Math.round(minutes*60);
  return null;
}

export function formatDurationSeconds(seconds:number):string{
  const safe=Math.max(0,Math.round(seconds));
  const mins=Math.floor(safe/60);
  const secs=safe%60;
  if(mins===0)return secs+" s";
  return mins+" min"+(secs?" "+secs+" s":"");
}

export function formatStepDuration(step:Record<string,unknown>):string|null{
  const seconds=stepDurationSeconds(step);
  return seconds===null?null:formatDurationSeconds(seconds);
}

export function timedStepBreakdown(steps:Record<string,unknown>[]):string{
  let cycling=0,mobility=0,other=0;
  for(const step of steps){
    const seconds=stepDurationSeconds(step);
    if(seconds===null)continue;
    const name=String(step.name??"").toLowerCase();
    const source=String(step.source_garmin_sport??"").toLowerCase();
    const category=String(step.category??"").toLowerCase();
    if(/bici|cicl|pedal/.test(name)||/cycling|cardio/.test(source))cycling+=seconds;
    else if(/movil|estir|respir/.test(name)||category==="mobility")mobility+=seconds;
    else other+=seconds;
  }
  const parts:string[]=[];
  if(cycling)parts.push("Bicicleta "+formatDurationSeconds(cycling));
  if(mobility)parts.push("Movilidad "+formatDurationSeconds(mobility));
  if(other)parts.push("Otros "+formatDurationSeconds(other));
  return parts.join(" · ");
}
