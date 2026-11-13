const assert=require('assert'),fs=require('fs'),vm=require('vm');vm.runInThisContext(fs.readFileSync(__dirname+'/lbl-v3.71-scheduler.js','utf8'));
const p=(id,Subcategory,more={})=>({ID:id,Name:id,Category:'Food',Subcategory,...more});
assert(TimeSlotEngine.eligible(p('museum','Museum',{Category:'Culture'}),'LateMorning'));
assert(TimeSlotEngine.eligible(p('park','Park',{Category:'Experience'}),'MorningActivity'));
assert(!TimeSlotEngine.eligible(p('ice','Ice Cream Shop',{Dinner:'TRUE'}),'Dinner'));
assert(TimeSlotEngine.eligible(p('ice','Ice Cream Shop'),'Treat'));
assert(!TimeSlotEngine.eligible(p('bak','Bakery',{Dinner:'TRUE'}),'Dinner'));
assert(!TimeSlotEngine.eligible(p('pub','Pub',{Morning:'TRUE'}),'Breakfast'));
assert(!TimeSlotEngine.eligible(p('restaurant','Restaurant',{Dinner:'FALSE'}),'Dinner'));
assert(TimeSlotEngine.bool('FALSE')===false);
assert(!TimeSlotEngine.eligible(p('museum','Museum',{Category:'Culture',Opening_Hours:'Mo-Su 10:00-17:00'}),'MorningActivity'));
assert(TimeSlotEngine.eligible(p('museum','Museum',{Category:'Culture',Opening_Hours:'Mo-Su 10:00-17:00'}),'LateMorning'));
const list=[p('park','Park',{Category:'Experience'}),p('museum','Museum',{Category:'Culture'}),p('cafe','Cafe'),p('bakery','Bakery'),p('restaurant','Restaurant'),p('diner','Diner'),p('pub','Pub'),p('ice','Ice Cream Shop')];
const result=TimeSlotEngine.plan(list,2);
assert.equal(result.days.length,2);
assert.equal(new Set(result.days.flat().map(x=>x.ID)).size,result.days.flat().length);
assert(result.days.flat().every(x=>TimeSlotEngine.eligible(x,x._planSlot)));
for(const city of ['chicago','new_york','los_angeles']){
 const data=JSON.parse(fs.readFileSync(__dirname+'/cities/'+city+'.json','utf8'));
 const plan=TimeSlotEngine.plan(data,5);
 assert.equal(plan.days.length,5);
 assert(plan.days.flat().every(x=>TimeSlotEngine.eligible(x,x._planSlot)));
 console.log(city,data.length,'5-day slots',plan.days.map(d=>d.length),'unfilled',plan.unfilled.length);
}
console.log('v3.71 scheduler tests passed');
