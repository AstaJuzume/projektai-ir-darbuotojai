const {readFileSync,existsSync}=require('node:fs');
const vm=require('node:vm');const assert=require('node:assert/strict');
const base=existsSync('dist/app.js')?'dist/':'';
let exported;
const ctx={localStorage:{getItem:()=>null},document:{addEventListener(){},createElement:()=>({click(){}})},console,Blob,URL:{createObjectURL(blob){exported=blob;return 'blob:demo'},revokeObjectURL(){}},setTimeout(){}};
vm.createContext(ctx);
for(const file of ['work-rules.js','workflow.js','day-sheet.js','app.js'])vm.runInContext(readFileSync(base+file,'utf8').replace(/\nrender\(\);\s*$/,''),ctx);
const run=code=>vm.runInContext(code,ctx);
run(`
 db.projects[0].name='OWN_OBJECT';db.projects[0].managers=[1,6];
 db.projects[1].name='HIDDEN_OBJECT';db.projects[1].managers=[6];
 db.projects[2].name='HIDDEN_EMPTY_OBJECT';db.projects[2].managers=[];
 db.employees.find(e=>e.id===6).name='HIDDEN_WORKER';
 db.entries.find(r=>r.employee===6).comment='HIDDEN_TEAM_HOURS';
 const sample=db.entries.find(r=>r.employee===1);
 db.entries.push({...sample,id:10001,author:6,comment:'OWN_TEAM_OTHER_AUTHOR'});
 db.entries.push({...sample,id:10002,project:2,comment:'OWN_TEAM_HIDDEN_OBJECT'});
 db.entries.push({...sample,id:10003,employee:6,team:2,comment:'OTHER_TEAM_SAME_AUTHOR'});
 toast=()=>{};
`);
assert.deepEqual(Array.from(run('visibleProjects().map(p=>p.id)')),[1]);
assert.ok(run("visibleRows().some(r=>r.comment==='OWN_TEAM_OTHER_AUTHOR')"),'Visibility follows team, not author');
assert.ok(!run("visibleRows().some(r=>r.comment==='OWN_TEAM_HIDDEN_OBJECT'||r.comment==='OTHER_TEAM_SAME_AUTHOR')"));
for(const expression of ['overview()','projectsView()','projectView()','timeView()','reportsView()','employeesView()','dayReviewView()','filterBar()','projectOptions(1)']){
 const html=run(expression);
 for(const hidden of ['HIDDEN_OBJECT','HIDDEN_EMPTY_OBJECT','HIDDEN_WORKER','HIDDEN_TEAM_HOURS','OWN_TEAM_HIDDEN_OBJECT','OTHER_TEAM_SAME_AUTHOR'])assert.ok(!html.includes(hidden),`${expression} leaked ${hidden}`);
}
run('state.project=2;state.employee=6');
assert.ok(!run('projectView()').includes('HIDDEN_OBJECT'));
assert.ok(!run('employeeView()').includes('HIDDEN_WORKER'));
assert.throws(()=>run('requireTeamScope(2,1,[1])'));
assert.throws(()=>run('requireTeamScope(1,2,[6])'));
assert.throws(()=>run('requireTeamScope(1,1,[6])'));
assert.doesNotThrow(()=>run('requireTeamScope(1,1,[1])'));
run('state.project=1;state.employee=1');
// Capture picker HTML before its DOM wiring; hidden projects/people/teams must not be selectable.
run("openModal=(title,body)=>{globalThis.modalBody=body;throw Error('CAPTURED_FORM')}");
for(const call of ['openDaySheet()','openTransfer()']){
 assert.throws(()=>run(call),/CAPTURED_FORM/);
 const html=run('modalBody');
 for(const hidden of ['HIDDEN_OBJECT','HIDDEN_EMPTY_OBJECT','HIDDEN_WORKER'])assert.ok(!html.includes(hidden),`${call} leaked ${hidden}`);
}
// A transferred worker appears in the receiving team's list only through that team's own interval.
run('db.entries.push({...db.entries[0],id:10004,employee:6,team:1,project:1,author:1})');
assert.ok(run('canSeeEmployee(6)'));
assert.ok(!run('visibleRows().some(r=>r.employee===6&&r.team===2)'));
async function checkExport(){
 run("exportCSV('all')");const csv=await exported.text();
 assert.ok(csv.includes('OWN_TEAM_OTHER_AUTHOR'));
 for(const hidden of ['HIDDEN_OBJECT','HIDDEN_TEAM_HOURS','OWN_TEAM_HIDDEN_OBJECT','OTHER_TEAM_SAME_AUTHOR'])assert.ok(!csv.includes(hidden),`CSV leaked ${hidden}`);
 for(const id of [1001,1002,1003]){
  run('state.user='+id);
  assert.equal(run('visibleProjects().length'),3);
  assert.equal(run('visibleRows().length===db.entries.length'),true);
  assert.doesNotThrow(()=>run('requireTeamScope(2,2,[6])'));
 }
 run("state.user=1001;globalThis.expenseTitle=expensesView()");
 assert.ok(run("expenseTitle.includes('Būsto ir kitos išlaidos')"));
 console.log('Passed: assigned objects, team rather than author visibility, hidden-object/other-team guards, scoped pickers and CSV, transferred workers, all three administrators, renamed expenses.');
}
checkExport().catch(error=>{console.error(error);process.exitCode=1});
