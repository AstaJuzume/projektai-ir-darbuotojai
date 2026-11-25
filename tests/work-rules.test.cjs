const {readFileSync,existsSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={};vm.createContext(context);vm.runInContext(readFileSync(existsSync('dist/work-rules.js')?'dist/work-rules.js':'work-rules.js','utf8'),context);const R=context.WorkRules;
const row=(employee,start,end,overrides={})=>({id:employee,employee,date:'2026-11-25',team:1,attendance:'Dirbo',start,end,lunchStart:'12:00',proposedHours:null,...overrides});
assert.equal(R.calculate(row(1,'06:00','18:00')).actual,11.5);
const split=[row(1,'06:00','12:00'),row(1,'12:00','18:00',{id:10})];assert.equal(split.reduce((s,r)=>s+R.calculate(r).actual,0),11.5);assert.equal(split.reduce((s,r)=>s+R.calculate(r).lunch,0),30);
const missing=row(3,'','',{attendance:'Nepateisintas neatvykimas'});
const records=[row(1,'07:00','11:00'),row(1,'11:00','17:30',{id:12}),row(2,'07:00','15:30'),missing,row(4,'06:00','20:00',{team:2})];
assert.equal(R.teamAverage(records,missing).value,9);assert.equal(R.teamAverage(records,missing).people,2);assert.equal(R.proposal(records,missing).actual,0);assert.equal(R.proposal(records,missing).value,-9);
assert.equal(R.proposal([missing],missing).value,null);
const adjusted=row(1,'06:00','18:00',{proposedHours:10});assert.equal(R.proposal([adjusted],adjusted).actual,11.5);assert.equal(R.proposal([adjusted],adjusted).delta,-1.5);
assert.equal(R.conflicts([row(1,'07:00','11:00')],row(1,'11:00','17:00'),null).length,0);
assert.equal(R.conflicts([row(1,'07:00','11:00')],row(1,'10:59','17:00'),null).length,1);
assert.equal(R.conflicts([missing],row(3,'07:00','11:00'),null).length,1);
assert.equal(R.conflicts([row(1,'07:00','11:00')],row(2,'07:00','11:00'),null).length,0);
assert.throws(()=>R.calculate(row(1,'18:00','06:00')));
console.log('Passed: actual hours, single daily lunch across objects, distinct coworker daily average, no-data case, separate adjustment, interval/absence conflicts.');

const frozen={...missing,status:"Patvirtinta",approvedProposal:{value:-9,delta:-9,reference:{value:9,people:2}}};assert.equal(R.proposal([...records,row(8,"06:00","23:00")],frozen).value,-9);

// Mixed attendance is validated together, with a separate assessment per employee.
const mixed=[
 row(1,'07:00','18:30',{id:undefined,proposedHours:11,comment:''}),
 row(2,'','',{id:undefined,attendance:'Pateisintas neatvykimas',absenceReason:'Liga',comment:''}),
 row(3,'','',{id:undefined,attendance:'Nepateisintas neatvykimas',comment:'Neatvyko'}),
 row(4,'07:00','18:30',{id:undefined,proposedHours:8,comment:'Atlikta mažiau darbų'})
];
assert.equal(R.validateBatch([],mixed).length,4);
assert.equal(mixed.reduce((s,r)=>s+R.calculate(r).actual,0),22);
assert.equal(R.proposal(mixed,mixed[2]).value,-11);
assert.equal(R.proposal(mixed,mixed[3]).actual,11);
assert.equal(R.proposal(mixed,mixed[3]).value,8);
assert.throws(()=>R.validateBatch([],[{...mixed[1],absenceReason:''}]));
assert.doesNotThrow(()=>R.validateBatch([],[{...mixed[3],comment:''}],false));
assert.throws(()=>R.validateBatch([],[{...mixed[3],comment:''}],true));
assert.throws(()=>R.validateBatch([],[row(1,'07:00','11:00',{id:undefined}),row(1,'10:00','15:00',{id:undefined})]));
const existing=[row(1,'07:00','11:00')];const untouched=JSON.stringify(existing);
assert.throws(()=>R.validateBatch(existing,[row(1,'10:00','15:00',{id:undefined})]));
assert.equal(JSON.stringify(existing),untouched);
console.log('Passed: mixed roster, per-person 11h/8h assessment, draft/final validation, batch overlap detection and atomic validation.');
