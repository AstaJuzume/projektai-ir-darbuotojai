const {readFileSync,existsSync}=require('node:fs');
const vm=require('node:vm');const assert=require('node:assert/strict');
const base=existsSync('dist/app.js')?'dist/':'';
const ctx={localStorage:{getItem:()=>null},document:{addEventListener(){}},console};vm.createContext(ctx);
vm.runInContext(readFileSync(base+'work-rules.js','utf8'),ctx);
vm.runInContext(readFileSync(base+'workflow.js','utf8'),ctx);
vm.runInContext(readFileSync(base+'app.js','utf8').replace(/\nrender\(\);\s*$/,''),ctx);
vm.runInContext(`db.audit.push({id:1,scope:'expenses',action:'Būsto išlaida',details:'PRIVATE_EXPENSE_A',before:'',after:''},{id:2,action:'Būsto išlaida',details:'PRIVATE_EXPENSE_LEGACY',before:'',after:''});`,ctx);
for(const id of [1001,1002,1003,1]){
 vm.runInContext('state.user='+id,ctx);
 const views=vm.runInContext('[nav().map(r=>r[0]),projectsView(),projectView(),reportsView(),expensesView(),requestsView(),dayReviewView(),coverageView()]',ctx);
 if(id===1001){assert.ok(views[0].includes('expenses'));assert.ok(views[4].includes('Būstas A'));assert.ok(views[5].includes('PRIVATE_EXPENSE_A'));assert.ok(views[5].includes('PRIVATE_EXPENSE_LEGACY'));}
 else{assert.ok(!views[0].includes('expenses'));for(const html of views.slice(1)){assert.ok(!html.includes('Būsto išlaidos'));assert.ok(!html.includes('Būstas A'));assert.ok(!html.includes('PRIVATE_EXPENSE'));}assert.equal(views[4],'');vm.runInContext('expenseModal()',ctx);}
}
console.log('Passed: only company head sees expense menu, cards, reports, details and current/legacy expense audit entries; other admins and supervisors cannot open expense forms.');
