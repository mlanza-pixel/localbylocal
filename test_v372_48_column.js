const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/lbl-v3.8-scheduler.js','utf8');
const e=vm.runInNewContext(src+'\nTimeSlotEngine;');
assert.equal(e.duration({Suggested_Visit_Duration_Minutes:120},{duration:60}),120);
assert.equal(e.duration({Suggested_Visit_Duration_Minutes:null},{duration:60}),60);
assert.equal(e.duration({Suggested_Visit_Duration_Minutes:'junk'},{duration:60}),60);
assert.equal(e.duration({Suggested_Visit_Duration_Minutes:999},{duration:60}),60);
assert.equal(e.duration({Suggested_Visit_Duration_Minutes:0},{duration:60}),60);
for(const name of ['chicago','new_york','los_angeles']){
 const rows=JSON.parse(fs.readFileSync(__dirname+'/cities/'+name+'.json','utf8'));
 assert(rows.every(p=>Object.prototype.hasOwnProperty.call(p,'Suggested_Visit_Duration_Minutes')));
 const out=e.plan(rows,3);
 const ids=new Set();let count=0;
 for(const day of out.days)for(const stop of day){
  assert(!ids.has(String(stop.ID)));ids.add(String(stop.ID));count++;
  assert(stop._planDuration>=10&&stop._planDuration<=480);
 }
 console.log(name,rows.length,'3-day scheduled stops',count,'unfilled',out.unfilled.length);
}
console.log('PASS: v3.72 48-column integration');
