export type Place = {id:string; name:string; kind:string; x:number; y:number; open:number; close:number};
export type Edge = {id:string; a:string; b:string; minutes:number; mode:string};
export type City = {places:Place[]; edges:Edge[]};
export type Activity = {id:string; title:string; place:string; duration:number; earliest:number; deadline:number; deadlineType:'arrival'|'finish'; priority:'essential'|'flexible'; fixedOrder:boolean};
export type Plan = {startPlace:string; startTime:number; activities:Activity[]};
export type Disruption = {edge:string; delay:number; closedPlace?:string};
export type Path = {nodes:string[]; edges:string[]; minutes:number};
export type Step = {activity:Activity; depart:number; arrive:number; start:number; finish:number; wait:number; path:Path|null; valid:boolean; reason:string; projected:boolean};
export type Result = {steps:Step[]; omitted:Activity[]; finish:number; travel:number; wait:number; completed:number; essential:number; all:boolean; order:string[]; label:string};
export const noDisruption:Disruption={edge:'',delay:0};
export const time=(m:number)=>Number.isFinite(m)?`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`:'—';
export function shortest(city:City,from:string,to:string,d:Disruption):Path|null {
 if(from===to)return {nodes:[from],edges:[],minutes:0};
 const dist=new Map(city.places.map(p=>[p.id,Infinity])); if(!dist.has(from)||!dist.has(to))return null;
 const prev=new Map<string,{node:string;edge:string}>(); const remaining=new Set(dist.keys()); dist.set(from,0);
 while(remaining.size){const u=[...remaining].sort((a,b)=>dist.get(a)!-dist.get(b)!)[0];const base=dist.get(u)!;if(!Number.isFinite(base))break;remaining.delete(u);if(u===to)break;
 for(const e of city.edges){const v=e.a===u?e.b:e.b===u?e.a:null;if(!v||!remaining.has(v))continue;const n=base+e.minutes+(e.id===d.edge?d.delay:0);if(n<dist.get(v)!){dist.set(v,n);prev.set(v,{node:u,edge:e.id});}}
 }
 if(!Number.isFinite(dist.get(to)))return null;const nodes=[to],edges:string[]=[];let u=to;while(u!==from){const p=prev.get(u);if(!p)return null;edges.unshift(p.edge);nodes.unshift(p.node);u=p.node;}return {nodes,edges,minutes:dist.get(to)!};
}
function adjustPath(city:City,p:Path|null,d:Disruption):Path|null {if(!p)return null;return {...p,minutes:p.edges.reduce((s,id)=>s+city.edges.find(e=>e.id===id)!.minutes+(id===d.edge?d.delay:0),0)};}
export function evaluate(city:City,plan:Plan,d:Disruption,order:Activity[]=plan.activities,locked?:Result,label='Scenario'):Result {
 let cursor=plan.startTime,place=plan.startPlace,travel=0,wait=0,blocked=false;const steps:Step[]=[];
 for(const a of order){const dest=city.places.find(p=>p.id===a.place);const path=locked?adjustPath(city,locked.steps.find(s=>s.activity.id===a.id)?.path??null,d):shortest(city,place,a.place,d);
 const depart=cursor,arrive=path?cursor+path.minutes:cursor,start=Math.max(arrive,a.earliest,dest?.open??0),finish=start+a.duration;
 const reasons:string[]=[];if(!path)reasons.push('No connected route');if(!dest)reasons.push('Unknown location');if(d.closedPlace===a.place)reasons.push('Service closed');if(dest&&finish>dest.close)reasons.push(`Service closes at ${time(dest.close)}`);if((a.deadlineType==='arrival'?arrive:finish)>a.deadline)reasons.push(`Misses ${time(a.deadline)} ${a.deadlineType} deadline`);
 const valid=!reasons.length;steps.push({activity:a,depart,arrive,start,finish,wait:start-arrive,path,valid,reason:reasons.join(' · '),projected:blocked});if(!valid)blocked=true;cursor=finish;place=a.place;travel+=path?.minutes??0;wait+=start-arrive;
 }
 const omitted=plan.activities.filter(a=>!order.some(b=>b.id===a.id));return {steps,omitted,finish:cursor,travel,wait,completed:steps.filter(s=>s.valid).length,essential:steps.filter(s=>s.valid&&s.activity.priority==='essential').length,all:!omitted.length&&steps.every(s=>s.valid),order:order.map(a=>a.id),label};
}
function permutations<T>(items:T[]):T[][] {if(!items.length)return [[]];return items.flatMap((v,i)=>permutations(items.filter((_,j)=>i!==j)).map(p=>[v,...p]));}
function allowed(original:Activity[],order:Activity[]):boolean { // fixed-order activities maintain position relative to all retained activities
 for(const a of order){if(!a.fixedOrder)continue;for(const b of order){if(a.id===b.id)continue;if((original.indexOf(a)<original.indexOf(b))!==(order.indexOf(a)<order.indexOf(b)))return false;}}return true;
}
export function recover(city:City,plan:Plan,d:Disruption):Result[]{
 const acts=plan.activities;if(acts.length>6)return [];const candidates:Result[]=[];const seen=new Set<string>();
 for(let mask=(1<<acts.length)-1;mask>0;mask--){const subset=acts.filter((_,i)=>mask&(1<<i));for(const order of permutations(subset)){if(!allowed(acts,order))continue;const r=evaluate(city,plan,d,order,undefined,order.map(a=>a.id).join()===acts.map(a=>a.id).join()?'Alternative route':subset.length<acts.length?'Partial recovery':'Reordered journey');if(!r.steps.every(s=>s.valid))continue;const key=r.order.join();if(!seen.has(key)){seen.add(key);candidates.push(r);}}}
 return candidates.sort((a,b)=>b.essential-a.essential||b.completed-a.completed||a.finish-b.finish||a.travel-b.travel||a.order.join().localeCompare(b.order.join())).slice(0,8);
}
export function validateActivity(a:Activity,city:City):string {if(!a.title.trim())return 'Enter an activity name.';if(!city.places.some(p=>p.id===a.place))return 'Choose a location.';if(!Number.isInteger(a.duration)||a.duration<1||a.duration>240)return 'Duration must be 1–240 minutes.';if(!Number.isInteger(a.earliest)||!Number.isInteger(a.deadline)||a.earliest<0||a.deadline>1440||a.earliest>a.deadline)return 'Enter a valid time window.';return '';}
