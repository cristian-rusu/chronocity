import type {City,Plan,Activity} from './engine.js';
export const city:City={places:[
{id:'work',name:'Westhaven',kind:'Work / origin',x:105,y:315,open:0,close:1440},
{id:'station',name:'Central Station',kind:'Transport',x:260,y:315,open:0,close:1440},
{id:'hall',name:'City Hall',kind:'Public service',x:430,y:165,open:540,close:1020},
{id:'child',name:'Little Oaks',kind:'Childcare',x:655,y:300,open:450,close:1040},
{id:'pharmacy',name:'North Pharmacy',kind:'Pharmacy',x:655,y:110,open:540,close:1140},
{id:'library',name:'Public Library',kind:'Library',x:260,y:105,open:540,close:1080},
{id:'park',name:'River Park',kind:'Transfer',x:430,y:390,open:0,close:1440},
{id:'clinic',name:'East Clinic',kind:'Healthcare',x:820,y:165,open:540,close:1080},
{id:'market',name:'Market Square',kind:'Shopping',x:820,y:390,open:480,close:1200},
{id:'home',name:'Southbank',kind:'Home',x:105,y:490,open:0,close:1440}],edges:[
{id:'west-central',a:'work',b:'station',minutes:8,mode:'Tram'}, {id:'central-hall',a:'station',b:'hall',minutes:12,mode:'Tram'},
{id:'west-library',a:'work',b:'library',minutes:18,mode:'Bus'},{id:'library-hall',a:'library',b:'hall',minutes:12,mode:'Walk'},
{id:'hall-child',a:'hall',b:'child',minutes:20,mode:'Bus'},{id:'child-pharmacy',a:'child',b:'pharmacy',minutes:10,mode:'Walk'},
{id:'hall-pharmacy',a:'hall',b:'pharmacy',minutes:15,mode:'Walk'},{id:'station-park',a:'station',b:'park',minutes:14,mode:'Walk'},
{id:'park-child',a:'park',b:'child',minutes:12,mode:'Bus'},{id:'work-park',a:'work',b:'park',minutes:16,mode:'Bus'},
{id:'pharmacy-clinic',a:'pharmacy',b:'clinic',minutes:10,mode:'Walk'},{id:'child-market',a:'child',b:'market',minutes:12,mode:'Walk'},
{id:'clinic-market',a:'clinic',b:'market',minutes:18,mode:'Bus'},{id:'work-home',a:'work',b:'home',minutes:10,mode:'Walk'},
{id:'home-park',a:'home',b:'park',minutes:22,mode:'Bus'},{id:'park-hall',a:'park',b:'hall',minutes:18,mode:'Walk'}]};
const act=(id:string,title:string,place:string,duration:number,deadline:number,priority:Activity['priority']='essential',deadlineType:Activity['deadlineType']='finish'):Activity=>({id,title,place,duration,earliest:0,deadline,deadlineType,priority,fixedOrder:false});
export const profiles:{id:string;name:string;role:string;initials:string;plan:Plan}[]=[
{id:'emma',name:'Emma',role:'Working parent',initials:'EM',plan:{startPlace:'work',startTime:960,activities:[act('hall','Collect official document','hall',20,1020),act('child','Pick up child','child',5,1040,'essential','arrival'),act('pharmacy','Visit pharmacy','pharmacy',10,1140,'flexible')]}},
{id:'noah',name:'Noah',role:'Shift worker',initials:'NO',plan:{startPlace:'home',startTime:930,activities:[act('hall','Register address','hall',20,1020),act('clinic','Clinic appointment','clinic',25,1080),act('market','Buy groceries','market',15,1200,'flexible')]}},
{id:'maya',name:'Maya',role:'Student commuter',initials:'MA',plan:{startPlace:'work',startTime:960,activities:[act('hall','Collect student certificate','hall',15,1020),act('library','Return library books','library',10,1080,'flexible'),act('market','Collect supplies','market',15,1200,'flexible')]} }];
