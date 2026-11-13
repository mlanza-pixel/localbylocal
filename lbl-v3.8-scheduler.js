/* Local by Local v3.8 — flexible day planner. Times are local to the destination.
   Unknown hours remain explicitly unverified. No assumptions about visit date. */
const TimeSlotEngine=(()=>{
 const SLOTS=[
  {key:'Breakfast',time:510,duration:45,flag:'Morning'},
  {key:'MorningActivity',time:570,duration:75,flag:'Morning'},
  {key:'LateMorning',time:660,duration:90,flag:'Morning'},
  {key:'Lunch',time:765,duration:60,flag:'Lunch'},
  {key:'Afternoon',time:855,duration:75,flag:'Afternoon'},
  {key:'Treat',time:960,duration:30,flag:'Afternoon'},
  {key:'Dinner',time:1140,duration:90,flag:'Dinner'},
  {key:'Nightlife',time:1290,duration:75,flag:'Nightlife'}
 ];
 const PAT={
  dessert:/ice.?cream|gelato|gelateria|dessert|frozen.?yogurt|chocolat|sweet.?shop/i,
  bakery:/bakery|pastry|donut|bagel|patisserie|boulangerie/i,
  bar:/\bbar\b|pub|tavern|nightclub|speakeasy|cocktail|wine.?bar|brewery|nightlife|gastropub/i,
  meal:/restaurant|diner|bistro|brasserie|steakhouse|pizza|pasta|mexican|italian|american|seafood|sushi|thai|indian|chinese|korean|ramen|tapas|food.?hall|fast.?food|burger|sandwich|bbq|barbecue/i,
  cafe:/cafe|coffee|breakfast|brunch|tea.?room/i,
  culture:/park|garden|museum|gallery|artwork|attraction|library|nature|arts.?centre|historic|monument|experience|theatre|landmark/i
 };
 const bool=v=>v===true||v===1||typeof v==='string'&&/^(true|yes|1|t)$/i.test(v.trim())?true:v===false||v===0||typeof v==='string'&&/^(false|no|0|f)$/i.test(v.trim())?false:null;
 const clock=n=>String(Math.floor((n%1440)/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 const display=n=>{const h=Math.floor(n/60)%24;return (h%12||12)+':'+String(n%60).padStart(2,'0')+(h<12?' AM':' PM');};
 function type(p){const txt=String(p.Category||'')+' '+String(p.Subcategory||'');
  const dessert=PAT.dessert.test(txt),bakery=PAT.bakery.test(txt),bar=PAT.bar.test(txt),meal=PAT.meal.test(txt),cafe=PAT.cafe.test(txt),culture=PAT.culture.test(txt);
  return {dessert,bakery,bar,meal,cafe,culture};}
 // Parse only simple, unambiguous OSM opening_hours ranges. Complex holiday/seasonal syntax => unknown.
 function hours(p,start,duration,dayIndex){
  const raw=String(p.Opening_Hours||p.opening_hours||'').trim();
  if(!raw)return 'unknown';
  if(raw==='24/7')return 'open';
  if(/PH|SH|sunrise|sunset|week|off|closed|\[|\{|\}|\+|\/\d{4}/i.test(raw))return 'unknown';
  // For trip dates not specified, never claim a venue open on the actual travel day.
  // Only reject when *every* explicitly stated time range is outside this slot.
  const intervals=[...raw.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)].map(m=>{
   const a=Number(m[1])*60+Number(m[2]),b=Number(m[3])*60+Number(m[4]);return [a,b<=a?b+1440:b];
  }).filter(([a,b])=>a<1440&&b<=2880);
  if(!intervals.length)return 'unknown';
  // OSM multi-day schedules may differ; cannot prove closed without day-of-week.
  if(intervals.some(([a,b])=>start>=a&&start+duration<=b))return 'possible';
  return 'closed';
 }
 function eligible(p,slot){
  const s=typeof slot==='string'?SLOTS.find(x=>x.key===slot)||SLOTS.find(x=>x.flag===slot):slot;
  if(!s)return false;
  const t=type(p),k=s.key;
  if(k==='Breakfast'&&!(t.cafe||t.bakery||(/breakfast|brunch|diner/i.test(String(p.Subcategory||'')))))return false;
  if(k==='MorningActivity'||k==='LateMorning'||k==='Afternoon'){
   if(!t.culture&&!t.cafe&&!t.bakery)return false;
   if(t.dessert&&k!=='Afternoon')return false;
  }
  if(k==='Lunch'||k==='Dinner'){
   if(!t.meal||t.dessert||t.bakery)return false;
   if(t.bar&&!/restaurant|gastropub|diner|bistro/i.test(String(p.Subcategory||'')))return false;
  }
  if(k==='Treat'&&!(t.dessert||t.bakery||t.cafe))return false;
  if(k==='Nightlife'&&!t.bar)return false;
  if(t.dessert&&!['Afternoon','Treat'].includes(k))return false;
  if(t.bakery&&['Dinner','Nightlife'].includes(k))return false;
  if(t.bar&&['Breakfast','MorningActivity','LateMorning'].includes(k))return false;
  // An explicit FALSE is authoritative; no provisional taxonomy fallback can override it.
  if(bool(p[s.flag])===false)return false;
  if(hours(p,s.time,s.duration)==='closed')return false;
  return true;
 }
 // Column 48 is an optional estimated visit duration, not opening-hours evidence.
 function duration(p,slot){
  const raw=p.Suggested_Visit_Duration_Minutes;
  if(raw===null||raw===undefined||String(raw).trim()==='')return slot.duration;
  const n=Number(raw);
  return Number.isInteger(n)&&n>=10&&n<=480?n:slot.duration;
 }
 function distance(a,b){if(!a||!b)return null;
  const x=Number(a.Latitude),y=Number(a.Longitude),u=Number(b.Latitude),v=Number(b.Longitude);
  if(![x,y,u,v].every(Number.isFinite)||!x||!y||!u||!v)return null;
  const rad=Math.PI/180,dx=(u-x)*rad,dy=(v-y)*rad;
  const h=Math.sin(dx/2)**2+Math.cos(x*rad)*Math.cos(u*rad)*Math.sin(dy/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
 function plan(places,days){
  const used=new Set(),out=[],unfilled=[];
  const source=places.filter(p=>p&&p.ID!==undefined&&p.Name);
  for(let day=1;day<=days;day++){
   const stops=[];
   for(let slotIndex=0;slotIndex<SLOTS.length;slotIndex++){
    const slot=SLOTS[slotIndex];
    const prior=stops[stops.length-1];let best=null,bestScore=-Infinity;
    for(const p of source){
     if(used.has(String(p.ID))||!eligible(p,slot))continue;
     const visit=duration(p,slot);
     // Never book an activity that cannot fit before the next fixed appointment.
     const next=SLOTS[slotIndex+1];
     if(next && slot.time+visit+10>next.time)continue;
     if(hours(p,slot.time,visit)==='closed')continue;
     const d=distance(prior,p),score=Number(p.Local_Score||0)*0.15+(hours(p,slot.time,slot.duration)==='possible'?3:0)-(d===null?0:Math.min(d,100)*1.2);
     // Reward category variety and limit repeat museums/cafes where possible.
     const prevType=prior?type(prior):null,now=type(p);
     const diversity=prevType&&((prevType.culture&&now.culture)||(prevType.cafe&&now.cafe))?-3:0;
     if(score+diversity>bestScore){best=p;bestScore=score+diversity;}
    }
    if(!best){unfilled.push({day,slot:slot.key});continue;}
    used.add(String(best.ID));
    const visit=duration(best,slot);
    const verification=hours(best,slot.time,visit);
    stops.push({...best,_planSlot:slot.key,_planSlotLabel:slot.key.replace(/([a-z])([A-Z])/g,'$1 $2')+' · '+display(slot.time),_planTime:slot.time,_planDuration:visit,_hoursStatus:verification});
   }
   out.push(stops);
  }
  return {days:out,unfilled};
 }
 return {bool,eligible,plan,hours,distance,display,duration,SLOTS};
})();
