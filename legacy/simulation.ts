import {city,profiles} from './data.js';
import type {Activity,City,Plan,Path,Result,Step} from './engine.js';
import {time} from './engine.js';
export type Incident={edge:string;delay:number;start:number;end:number;closure:string};
export type Policy={shuttle:boolean;lateHall:boolean;lateChild:boolean;extraBus:boolean};
export const defaultIncident:Incident={edge:'central-hall',delay:30,start:960,end:1080,closure:''};
export const blankPolicy:Policy={shuttle:false,lateHall:false,lateChild:false,extraBus:false};
export const policyOptions=[{id:'shuttle',title:'Emergency shuttle',description:'Open a direct Westhaven → City Hall connection.',cost:3},{id:'lateHall',title:'Late public service',description:'Extend City Hall by 60 minutes.',cost:2},{id:'lateChild',title:'Childcare buffer',description:'Extend facility hours by 30 minutes (personal deadlines stay fixed).',cost:2},{id:'extraBus',title:'Express bus',description:'Reduce River Park → Little Oaks travel by 5 minutes.',cost:2}] as const;
export const policyCost=(p:Policy)=>policyOptions.reduce((s,x)=>s+(p[x.id]?x.cost:0),0);
export function network(p:Policy):City {return {places:city.places.map(x=>({...x,close:x.close+(x.id==='hall'&&p.lateHall?60:x.id==='child'&&p.lateChild?30:0)})),edges:[...city.edges.map(e=>({...e,minutes:e.minutes-(e.id==='park-child'&&p.extraBus?5:0)})),...(p.shuttle?[{id:'shuttle',a:'work',b:'hall',minutes:18,mode:'Shuttle'}]:[])]};}
export const calm:Incident={...defaultIncident,delay:0,closure:''};
// FIFO traversal: either incur the incident's delay or wait for its end, whichever arrives first.
export function edgeTime(e:{id:string;minutes:number},depart:number,i:Incident){return e.minutes+(e.id===i.edge&&depart>=i.start&&depart<i.end?Math.min(i.delay,i.end-depart):0);}
export function route(c:City,from:string,to:string,depart:number,i:Incident,locked?:Path|null):Path|null{
 if(locked!==undefined){if(!locked||locked.nodes[0]!==from||locked.nodes.at(-1)!==to||locked.nodes.length!==locked.edges.length+1)return null;let t=depart;for(let j=0;j<locked.edges.length;j++){const e=c.edges.find(e=>e.id===locked.edges[j]);const a=locked.nodes[j],b=locked.nodes[j+1];if(!e||!((e.a===a&&e.b===b)||(e.b===a&&e.a===b)))return null;t+=edgeTime(e,t,i);}return {...locked,minutes:t-depart};}
 if(!c.places.some(p=>p.id===from)||!c.places.some(p=>p.id===to))return null;
 const times=new Map(c.places.map(p=>[p.id,Infinity]));times.set(from,depart);const prev=new Map<string,{node:string;edge:string}>();const remaining=new Set(times.keys());
 while(remaining.size){const u=[...remaining].reduce((a,b)=>times.get(a)!<=times.get(b)!?a:b);const t=times.get(u)!;if(!Number.isFinite(t))break;remaining.delete(u);if(u===to)break;for(const e of c.edges){const v=e.a===u?e.b:e.b===u?e.a:'';if(!remaining.has(v))continue;const next=t+edgeTime(e,t,i);if(next<times.get(v)!){times.set(v,next);prev.set(v,{node:u,edge:e.id});}}}
 if(!Number.isFinite(times.get(to)))return null;const nodes=[to],edges:string[]=[];let u=to;while(u!==from){const p=prev.get(u);if(!p)return null;edges.unshift(p.edge);nodes.unshift(p.node);u=p.node;}return {nodes,edges,minutes:times.get(to)!-depart};
}
export function simulate(c:City,p:Plan,i:Incident,order=p.activities,locked?:Result,label='Scenario'):Result{let cursor=p.startTime,loc=p.startPlace,travel=0,wait=0,blocked=false;const steps:Step[]=[];
 for(const a of order){const dest=c.places.find(x=>x.id===a.place);const path=route(c,loc,a.place,cursor,i,locked?locked.steps.find(s=>s.activity.id===a.id)?.path??null:undefined);const depart=cursor,arrive=cursor+(path?.minutes??0),start=Math.max(arrive,a.earliest,dest?.open??0),finish=start+a.duration;const reasons:string[]=[];if(!path||!dest)reasons.push('No connected route');if(i.closure===a.place)reasons.push('Service closed');if(dest&&finish>dest.close)reasons.push(`Service closes ${time(dest.close)}`);if((a.deadlineType==='arrival'?arrive:finish)>a.deadline)reasons.push(`Deadline ${time(a.deadline)} missed`);const valid=!reasons.length;steps.push({activity:a,depart,arrive,start,finish,wait:start-arrive,path,valid,reason:reasons.join(' · '),projected:blocked});if(!valid)blocked=true;cursor=finish;loc=a.place;travel+=path?.minutes??0;wait+=start-arrive;}
 const omitted=p.activities.filter(a=>!order.some(b=>a.id===b.id));return {steps,omitted,finish:cursor,travel,wait,completed:steps.filter(s=>s.valid).length,essential:steps.filter(s=>s.valid&&s.activity.priority==='essential').length,all:!omitted.length&&steps.every(s=>s.valid),order:order.map(a=>a.id),label};}
function allowedV2(original:Activity[],order:Activity[]){return order.every((a,j)=>!a.fixedOrder||order.every((b,k)=>(original.indexOf(a)<original.indexOf(b))===(j<k)));}
function permutationsV2<T>(a:T[]):T[][]{return !a.length?[[]]:a.flatMap((v,j)=>permutationsV2(a.filter((_,k)=>j!==k)).map(x=>[v,...x]));}
export function alternatives(c:City,p:Plan,i:Incident):Result[]{const a=p.activities;if(!a.length||a.length>6)return [];const r:Result[]=[];for(let mask=1;mask<1<<a.length;mask++){for(const order of permutationsV2(a.filter((_,j)=>mask&(1<<j)))){if(!allowedV2(a,order))continue;const label=order.length<a.length?'Partial recovery':order.every((x,j)=>x===a[j])?'Reroute':'Reorder activities';const x=simulate(c,p,i,order,undefined,label);if(x.steps.every(s=>s.valid))r.push(x);}}return r.sort((a,b)=>b.essential-a.essential||b.completed-a.completed||a.finish-b.finish||a.travel-b.travel||a.order.join().localeCompare(b.order.join())).slice(0,8);}
export type Citizen={id:string;name:string;group:string;plan:Plan};
export const cohort:Citizen[]=Array.from({length:60},(_,j)=>{const base=profiles[j%3];const plan:Plan=JSON.parse(JSON.stringify(base.plan));const offset=(Math.floor(j/3)%10-4)*5;plan.startTime+=offset;plan.activities=plan.activities.map((a,k)=>({...a,duration:Math.max(5,a.duration+((j+k)%3-1)*3),deadline:a.deadline+(a.place==='child'?((j%3)*5):0)}));if(j%5===0)plan.startPlace='home';return {id:`c${j}`,name:`${base.name} ${Math.floor(j/3)+1}`,group:base.role,plan};});
export function population(i:Incident,p:Policy){const c=network(p);const rows=cohort.map(x=>{const base=simulate(city,x.plan,calm);const disrupted=simulate(city,x.plan,i,undefined,base);const adapt=alternatives(city,x.plan,i)[0];const improved=alternatives(c,x.plan,i)[0];return {...x,base,disrupted,adapt,improved};});const metric=(key:'base'|'disrupted'|'adapt'|'improved')=>{const total=rows.reduce((s,r)=>s+r.plan.activities.length,0);const done=rows.reduce((s,r)=>s+(r[key]?.completed??0),0);return {done,total,percent:Math.round(done/total*100),complete:rows.filter(r=>r[key]?.all).length};};const groups=profiles.map(x=>{const members=rows.filter(r=>r.group===x.role);const rate=(key:'base'|'disrupted'|'adapt'|'improved')=>Math.round(members.reduce((s,r)=>s+(r[key]?.completed??0),0)/members.reduce((s,r)=>s+r.plan.activities.length,0)*100);return {name:x.role,baseline:rate('base'),disrupted:rate('disrupted'),adapt:rate('adapt'),improved:rate('improved')};});const gap=(key:'adapt'|'improved')=>Math.max(...groups.map(g=>g[key]))-Math.min(...groups.map(g=>g[key]));return {rows,base:metric('base'),disrupted:metric('disrupted'),adapt:metric('adapt'),improved:metric('improved'),groups,gapBefore:gap('adapt'),gapAfter:gap('improved'),affected:rows.filter(r=>r.base.completed>r.disrupted.completed).length};}

// Generate distinct route choices for the citizen without expanding the population search.
// Each additional candidate avoids one connection used by a feasible itinerary.
export function journeyAlternatives(c:City,p:Plan,i:Incident):Result[]{
 const base=alternatives(c,p,i);const results=[...base];const signature=(r:Result)=>r.steps.map(s=>`${s.activity.id}:${s.path?.edges.join(',')}`).join('|');const seen=new Set(base.map(signature));
 for(const r of base.filter(r=>r.all).slice(0,3)){
  const order=r.order.map(id=>p.activities.find(a=>a.id===id)!);
  for(const edge of new Set(r.steps.flatMap(s=>s.path?.edges||[]))){
   const candidate=simulate({...c,edges:c.edges.filter(e=>e.id!==edge)},p,i,order,undefined,'Alternative route');
   const key=signature(candidate);if(candidate.all&&!seen.has(key)){seen.add(key);results.push(candidate);}
  }
 }
 return results.sort((a,b)=>b.essential-a.essential||b.completed-a.completed||a.finish-b.finish||a.travel-b.travel||a.order.join().localeCompare(b.order.join())).slice(0,8);
}
