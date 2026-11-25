/* One roster, per-person attendance and end-of-day work assessment. */
function openDaySheet(entryId) {
  const source = entryId ? db.entries.find(r=>r.id===+entryId) : null;
  if(source&&(!canSeeEntry(source)||(!admin()&&source.author!==state.user)))return;
  if(!visibleProjects().length){toast('Jums dar nepriskirtas objektas. Kreipkitės į administratorių.');return;}
  const context = source ? {date:source.date,project:source.project,team:source.team,author:source.author} : {...(state.sheetContext||{}),date:state.sheetContext?.date||TODAY,project:state.sheetContext?.project||state.project,team:actor().team||state.sheetContext?.team||1,author:admin()?(state.sheetContext?.author||1):state.user};
  if(!canSeeProject(context.project))context.project=visibleProjects()[0].id;
  let rows=[], activeKey='', contextSettings={};
  const memo=new Map();
  const locked = record => record && record.status!=='Juodraštis' || record && !(corrector() || record.author===state.user);
  const canChange = record => !record || !locked(record);
  const attendanceOptions = value => [['Nepažymėta','Nepažymėta'],['Dirbo','Dirbo'],['Nepateisintas neatvykimas','Pravaikšta'],['Pateisintas neatvykimas','Pateisintas neatvykimas']].map(([v,t])=>`<option value="${v}" ${value===v?'selected':''}>${t}</option>`).join('');
  const body=`<input type="hidden" name="sheetMode" value="submit"><div class="sheet-context"><div class="sheet-fields">${field('Diena',`<input name="date" type="date" required value="${context.date}">`)}${field('Komanda',select('team',options(visibleTeams(),context.team,t=>t.name)))}${field('Objektas',select('project',projectOptions(context.project)))}${admin()?field('Darbų vadovas',select('author',options(db.users.filter(u=>u.kind==='supervisor'),context.author,u=>u.name))):`<div class="sheet-person"><span>Pildo</span><strong>${esc(actor().name)}</strong></div>`}</div><div class="sheet-defaults"><strong>Bendras darbo laikas</strong>${field('Nuo',`<input name="defaultStart" type="time" value="07:00" required>`)}${field('Iki',`<input name="defaultEnd" type="time" value="18:30" required>`)}${field('Pietų pradžia',`<input name="lunchStart" type="time" value="12:00" required>`)}<button type="button" class="btn small" id="sheet-apply-time">Taikyti dirbantiems</button><small>Pietūs – 30 min.</small></div></div><div class="sheet-guide"><span><b>1</b> Prie kiekvieno pažymėkite dalyvavimą.</span><span><b>2</b> Jei reikia, pakeiskite jo darbo intervalą.</span><span><b>3</b> Įrašykite atlikto darbo valandas ir komentarą.</span></div><div class="sheet-roster-tools"><div><strong>Komandos žiniaraštis</strong><span id="sheet-count" class="meta"></span></div><div class="actions"><button type="button" class="btn small" id="sheet-previous">Kopijuoti ankstesnę komandą</button><button type="button" class="btn small" id="sheet-transfer">Išsaugoti ir perkelti</button><button type="button" class="btn small" id="sheet-all-worked">Visi dirbo</button><button type="button" class="btn small" id="sheet-copy-fact">Atlikta = dirbta</button></div></div><div id="sheet-copy-notice" class="sheet-copy-notice" role="status" hidden></div><div class="sheet-table-wrap"><table class="sheet-table"><thead><tr><th>Įtraukti</th><th>Darbuotojas</th><th>Dalyvavimas</th><th>Darbo intervalas</th><th>Dirbta val.</th><th>Atlikto darbo val.</th><th>Pravaikštos korekcija</th><th>Priežastis / komentaras</th></tr></thead><tbody id="sheet-rows"></tbody></table></div><div class="sheet-add"><select id="sheet-add-person" aria-label="Pridėti darbuotoją į žiniaraštį"><option value="">Pasirinkite papildomą darbuotoją…</option>${options(visibleEmployees(),'',e=>e.name+' · '+team(e.team).name)}</select><button type="button" class="btn small" id="sheet-add-button">Pridėti darbuotoją</button></div><div id="sheet-summary" class="sheet-summary" role="status"></div><div class="sheet-transport"><div>${field('Komandos automobilis',`<select name="vehicle"><option value="">Nepriskirtas</option>${options(db.vehicles,team(context.team).vehicle,v=>v.plate+' · '+v.name)}</select>`)}</div><div>${field('Vairuotojas (nebūtina)',`<select name="driver"><option value="">Nenurodytas</option>${options(visibleEmployees(),'',e=>e.name)}</select>`)}</div></div><p class="sheet-explanation">„Dirbta val.“ apskaičiuojama iš darbo intervalo, atėmus pietus. „Atlikto darbo val.“ – vadovo dienos rezultato įvertinimas. Pavyzdys: dirbta 11 val., darbo atlikta už 8 val. – skirtumas −3 val., šalia įrašomas paaiškinimas.</p><p class="meta">Juodraštį galite tęsti dienos gale. Pateikus dieną administracijai, taisymus atlieka tik įgaliotas administratorius.</p>`;
  openModal('Komandos dienos žiniaraštis',body,'Pateikti dieną',(f)=>{
    requireTeamScope(+f.project,+f.team,rows.filter(r=>r.include).map(r=>r.employee));
    const mode=f.sheetMode;
    if(mode==='submit'&&rows.some(r=>r.include&&canChange(r.current)&&r.attendance==='Nepažymėta'))throw Error('Pažymėkite kiekvieno įtraukto darbuotojo dalyvavimą arba nuimkite jo įtraukimo žymę.');
    const selected=rows.filter(r=>r.include&&canChange(r.current)&&r.attendance!=='Nepažymėta');
    if(!selected.length)throw Error('Nėra naujų arba taisomų juodraščio eilučių. Pateiktų įrašų taisymui kreipkitės į administratorių.');
    const candidates=selected.map(r=>candidate(r,f,mode));
    // Validate the whole roster before changing a single record.
    try{R.validateBatch(db.entries,candidates,mode==='submit')}catch(error){throw Error(error.message.replace(/Darbuotojas #(\d+)/g,(_,id)=>employee(id)?.name||'Darbuotojas'))}
    for(const r of selected){const live=r.current&&db.entries.find(e=>e.id===r.current.id);if(live&&(live.status!=='Juodraštis'||!(corrector()||live.author===state.user)))throw Error('Vienas įrašas jau pateiktas. Atidarykite žiniaraštį iš naujo.');}
    for(let i=0;i<selected.length;i++){
      const r=selected[i],value=candidates[i];
      if(r.current){const before=snapshot(r.current);Object.assign(r.current,value);audit(mode==='submit'?'Pateiktas dienos žiniaraštis':'Išsaugotas dienos juodraštis',employee(r.employee).name,before,snapshot(r.current));}
      else{value.id=nextId(db.entries);db.entries.push(value);audit(mode==='submit'?'Pateiktas dienos žiniaraštis':'Išsaugotas dienos juodraštis',employee(r.employee).name,'',snapshot(value));}
    }
    if(!project(+f.project).managers.includes(+f.author||state.user))project(+f.project).managers.push(+f.author||state.user);
    state.sheetContext={date:f.date,project:+f.project,team:+f.team,author:+f.author||state.user};
    state.project=+f.project;
    save();closeModal();render();if(mode==='transfer'){openTransfer({date:f.date,project:+f.project,employeeIds:selected.filter(r=>r.attendance==='Dirbo').map(r=>r.employee)});return;}toast(mode==='submit'?`Pateiktas ${selected.length} darbuotojų dienos žiniaraštis.`:'Juodraštis išsaugotas. Dienos gale galėsite tęsti pildymą.');
  });
  const modal=$('#modal-root .modal'),form=$('#modal-form');modal.classList.add('day-sheet-modal');
  const primary=form.querySelector('button[type=submit]');primary.onclick=()=>form.elements.sheetMode.value='submit';
  const draft=document.createElement('button');draft.type='button';draft.className='btn';draft.id='sheet-save-draft';draft.textContent='Išsaugoti juodraštį';draft.onclick=()=>{form.elements.sheetMode.value='draft';form.requestSubmit()};primary.before(draft);
  function header(){return Object.fromEntries(new FormData(form));}
  function makeRow(e,current){const f=header();const row={key:current?'r'+current.id:'e'+e.id,employee:e.id,current,include:true,attendance:current?.attendance||'Dirbo',start:current?.start||f.defaultStart,end:current?.end||f.defaultEnd,comment:current?.comment||'',absenceReason:current?.absenceReason||'',resultEdited:current?.proposedHours!=null,proposedHours:current?.proposedHours??null};
    if(!current&&R.conflicts(db.entries,{employee:e.id,date:f.date,start:row.start,end:row.end,attendance:row.attendance}).length)row.include=false;
    return row;
  }
  function candidate(row,f,mode='draft'){
    if(locked(row.current))return {...row.current};
    const work=row.attendance==='Dirbo';const value={id:row.current?.id,employee:row.employee,date:f.date,team:+f.team,project:+f.project,author:+f.author||state.user,attendance:row.attendance,start:work?row.start:'',end:work?row.end:'',lunchStart:f.lunchStart,vehicle:+f.vehicle||null,driver:+f.driver||null,comment:row.comment.trim(),absenceReason:work?'':row.absenceReason,proposedHours:null,status:mode==='submit'?'Pateikta':'Juodraštis',approvedProposal:null};
    if(work)value.proposedHours=row.resultEdited?(row.proposedHours===''?null:Number(row.proposedHours)):R.calculate(value).actual;
    if(!work){if(row.attendance==='Nepateisintas neatvykimas'&&!value.comment)value.comment='Neatvyko be pateisinamos priežasties.';if(row.attendance==='Pateisintas neatvykimas'&&row.absenceReason)value.comment=value.comment||row.absenceReason;}
    return value;
  }
  function loadContext(){if(activeKey)memo.set(activeKey,{rows,settings:{...contextSettings}});const f=header();activeKey=[f.date,f.team,f.project,f.author||state.user].join('|');
    if(memo.has(activeKey)){const cached=memo.get(activeKey);rows=cached.rows;for(const [key,value] of Object.entries(cached.settings))form.elements[key].value=value;drawRows();return;}
    const existing=db.entries.filter(r=>r.date===f.date&&r.team===+f.team&&r.project===+f.project&&r.author===(+f.author||state.user));
    if(existing.length){form.elements.lunchStart.value=existing[0].lunchStart||'12:00';form.elements.vehicle.value=existing[0].vehicle||'';form.elements.driver.value=existing[0].driver||'';}
    rows=[];for(const e of db.employees.filter(e=>e.team===+f.team||existing.some(r=>r.employee===e.id))){const own=existing.filter(r=>r.employee===e.id);if(own.length)rows.push(...own.map(r=>makeRow(e,r)));else rows.push(makeRow(e));}
    drawRows();
  }
  function drawRows(){
    const f=header();$('#sheet-rows').innerHTML=rows.map(row=>{
      const read=locked(row.current),work=row.attendance==='Dirbo',unknown=row.attendance==='Nepažymėta',name=esc(employee(row.employee).name);let c;try{c=R.calculate(candidate(row,f))}catch{c={actual:NaN}}
      const result=row.resultEdited?row.proposedHours:(Number.isFinite(c.actual)?c.actual:'');
      return `<tr data-sheet-row="${row.key}" class="${read?'sheet-locked':!row.include?'sheet-not-included':work?'':'sheet-absent'}"><td data-label="Įtraukti"><input type="checkbox" data-field="include" aria-label="Įtraukti ${name}" ${row.include?'checked':''} ${read||row.current?'disabled':''}></td><td data-label="Darbuotojas"><strong>${name}</strong><div class="meta">${esc(employee(row.employee).job)}</div>${read?`<span class="badge gray">${esc(row.current.status)}</span>`:'<span class="sheet-conflict meta"></span>'}<div class="sheet-day-total meta"></div><details class="sheet-day-details"><summary>Visa matoma diena</summary><div></div></details></td><td data-label="Dalyvavimas"><select data-field="attendance" aria-label="${name} – dalyvavimas" ${read?'disabled':''}>${row.current?attendanceOptions(row.attendance).replace('value="Nepažymėta"','value="Nepažymėta" disabled'):attendanceOptions(row.attendance)}</select><div class="mobile-attendance">${[['Dirbo','Dirbo'],['Nepateisintas neatvykimas','Pravaikšta'],['Pateisintas neatvykimas','Pateisinta']].map(([value,label])=>`<button type="button" data-sheet-status="${value}" aria-label="${name} – ${label}" class="${row.attendance===value?'selected':''}" ${read?'disabled':''}>${label}</button>`).join('')}</div>${unknown?'<small class="attendance-missing">Dalyvavimas dar nepažymėtas</small>':''}</td><td data-label="Darbo intervalas"><div class="sheet-interval"><input type="time" data-field="start" aria-label="${name} – nuo" value="${row.start}" ${read||!work?'disabled':''}><span>–</span><input type="time" data-field="end" aria-label="${name} – iki" value="${row.end}" ${read||!work?'disabled':''}></div></td><td data-label="Dirbta val."><strong class="sheet-actual">${Number.isFinite(c.actual)?fmt(c.actual):'—'}</strong><span class="sheet-unit">val.</span><div class="meta sheet-lunch">${work&&Number.isFinite(c.actual)?'Pietūs '+c.lunch+' min.':unknown?'Nepažymėta':'Nedirbo'}</div></td><td data-label="Atlikto darbo val.">${work?`<input type="number" data-field="result" aria-label="${name} – atlikto darbo valandos" min="0" max="24" step="0.01" value="${esc(result)}" ${read?'disabled':''}><div class="meta sheet-delta"></div>`:`<span>${unknown?'—':'0 val.'}</span>`}</td><td data-label="Pravaikštos korekcija"><div class="sheet-absence-adjustment">—</div></td><td data-label="Priežastis / komentaras">${row.attendance==='Pateisintas neatvykimas'?`<select data-field="absenceReason" aria-label="${name} – pateisinama priežastis" ${read?'disabled':''}><option value="">Pasirinkite priežastį…</option>${['Liga','Atostogos','Suderintas neatvykimas','Kita pateisinama priežastis'].map(t=>`<option ${row.absenceReason===t?'selected':''}>${t}</option>`).join('')}</select>`:''}<input data-field="comment" aria-label="${name} – komentaras" placeholder="${work?'Komentaras, jei valandos skiriasi':row.attendance==='Nepateisintas neatvykimas'?'Neatvyko be pateisinamos priežasties':'Papildoma pastaba (nebūtina)'}" value="${esc(row.comment)}" ${read||unknown?'disabled':''}></td></tr>`;
    }).join('');updateSummary();
  }
  function updateSummary(){const f=header();contextSettings={lunchStart:f.lunchStart,vehicle:f.vehicle,driver:f.driver};let count=0,present=0,absent=0,justified=0,unmarked=0,worked=0,result=0;const candidates=[];
    for(const row of rows.filter(r=>r.include&&canChange(r.current)&&r.attendance!=='Nepažymėta')){try{candidates.push(candidate(row,f))}catch{}}
    const replacing=new Set(rows.filter(r=>r.include&&r.current&&canChange(r.current)).map(r=>r.current.id));const combined=[...db.entries.filter(r=>!replacing.has(r.id)),...candidates];
    for(const row of rows){const el=form.querySelector(`[data-sheet-row="${row.key}"]`);let c,v;try{v=candidate(row,f);c=R.calculate(v)}catch{c={actual:NaN,lunch:0}}
      const work=row.attendance==='Dirbo';el.querySelector('.sheet-actual').textContent=Number.isFinite(c.actual)?fmt(c.actual):'—';
      const net=el.querySelector('[data-field=result]');if(net&&!row.resultEdited)net.value=Number.isFinite(c.actual)?c.actual:'';
      const delta=el.querySelector('.sheet-delta');if(delta){const n=net.value===''?c.actual:Number(net.value);const d=R.round(n-c.actual);delta.textContent=Number.isFinite(d)&&d!==0?(d>0?'+':'')+fmt(d)+' val. skirtumas':'';delta.classList.toggle('negative',d<0);}
      el.querySelector('.sheet-lunch').textContent=work&&Number.isFinite(c.actual)?'Pietūs '+c.lunch+' min.':row.attendance==='Nepažymėta'?'Nepažymėta':'Nedirbo';
      if(v&&row.attendance==='Nepateisintas neatvykimas'){const average=R.teamAverage(combined,v);el.querySelector('.sheet-absence-adjustment').textContent=average.value===null?'Laukia duomenų':'−'+fmt(average.value)+' val.';}
      const conflict=el.querySelector('.sheet-conflict');if(conflict&&v){const other=db.entries.filter(r=>r.id!==row.current?.id&&!replacing.has(r.id));conflict.textContent=R.conflicts(other,v).length?'Šis laikas jau užimtas':'';conflict.classList.toggle('negative',!!conflict.textContent);}
      const view=combined.filter(canSeeEntry);const d=R.daySummary(view,row.employee,f.date);el.querySelector('.sheet-day-total').textContent=`Diena: ${fmt(d.actual)} dirbta / ${fmt(d.assessed)} atlikta val. · ${d.projects.length} obj.`;const details=el.querySelector('.sheet-day-details>div');details.innerHTML=d.rows.map(r=>`<p><strong>${esc(project(r.project).name)}</strong><br>${r.attendance==='Dirbo'?r.start+'–'+r.end:esc(r.attendance)} · ${fmt(R.calculate(r).actual)} / ${fmt(R.assessed(r))} val.</p>`).join('')||'<p>Nėra įrašų</p>';
      if(!row.include)continue;count++;if(row.attendance==='Nepažymėta'){unmarked++;continue;}if(work){present++;if(Number.isFinite(c.actual))worked+=c.actual;if(v&&Number.isFinite(v.proposedHours??c.actual))result+=v.proposedHours??c.actual;}else if(row.attendance==='Nepateisintas neatvykimas')absent++;else justified++;
    }
    $('#sheet-count').textContent=` · ${rows.length} žmonių / eilučių`;
    $('#sheet-summary').innerHTML=`<span><strong>${unmarked}</strong> nepažymėta</span><span><strong>${present}</strong> dirbo</span><span><strong>${absent}</strong> pravaikštos</span><span><strong>${justified}</strong> pateisinti neatvykimai</span><span><strong>${fmt(worked)}</strong> dirbta val.</span><span><strong>${fmt(result)}</strong> atlikto darbo val.</span>`;
  }
  const roster=$('#sheet-rows');
  function editRow(event){const element=event.target.closest('[data-field]');if(!element)return;const tr=element.closest('[data-sheet-row]'),row=rows.find(r=>r.key===tr.dataset.sheetRow);if(locked(row.current))return;const key=element.dataset.field;
    if(key==='include'){row.include=element.checked;tr.classList.toggle('sheet-not-included',!row.include);}
    else if(key==='result'){row.resultEdited=true;row.proposedHours=element.value;}
    else row[key]=element.value;
    if(key==='attendance'&&!row.current)row.include=true;
    if(key==='attendance'){drawRows();return;}updateSummary();
  }
  roster.addEventListener('click',event=>{const button=event.target.closest('[data-sheet-status]');if(!button)return;const row=rows.find(r=>r.key===button.closest('[data-sheet-row]').dataset.sheetRow);if(locked(row.current))return;row.attendance=button.dataset.sheetStatus;if(!row.current)row.include=true;drawRows();});
  roster.addEventListener('input',editRow);roster.addEventListener('change',editRow);
  form.addEventListener('change',event=>{
    if(['date','team','project','author'].includes(event.target.name)){
      if(event.target.name==='team'){const t=team(+event.target.value);form.elements.vehicle.value=t.vehicle||'';if(admin())form.elements.author.value=db.users.find(u=>u.team===t.id)?.id||1;}
      loadContext();
    }else if(['lunchStart','vehicle','driver'].includes(event.target.name))updateSummary();
  });
  $('#sheet-apply-time').onclick=()=>{for(const row of rows.filter(r=>r.include&&canChange(r.current)&&r.attendance==='Dirbo')){row.start=form.elements.defaultStart.value;row.end=form.elements.defaultEnd.value;}drawRows()};
  $('#sheet-all-worked').onclick=()=>{for(const row of rows.filter(r=>r.include&&canChange(r.current)))row.attendance='Dirbo';drawRows()};
  $('#sheet-copy-fact').onclick=()=>{for(const row of rows.filter(r=>r.include&&canChange(r.current)&&r.attendance==='Dirbo')){row.resultEdited=false;row.proposedHours=null;}drawRows()};
  $('#sheet-add-button').onclick=()=>{const id=+$('#sheet-add-person').value;if(!id||!canSeeEmployee(id))return;if(rows.some(r=>r.employee===id)){toast('Šis darbuotojas jau yra žiniaraštyje.');return;}rows.push(makeRow(employee(id)));drawRows();$('#sheet-add-person').value='';};
  $('#sheet-transfer').onclick=()=>{form.elements.sheetMode.value='transfer';form.requestSubmit()};
  $('#sheet-previous').onclick=()=>{
    const f=header(),previous=R.previousRoster(db.entries,+f.author||state.user,+f.team,f.date);
    if(!previous){toast('Ankstesnės darbo dienos įrašų šiai komandai nėra.');return;}
    if(!canSeeProject(previous.project)){toast('Ankstesnės komandos objektas jums nebepriskirtas.');return;}
    form.elements.project.value=previous.project;loadContext();
    const existing=rows.filter(r=>r.current);
    rows=[...existing];for(const id of previous.employeeIds.filter(canSeeEmployee))if(!rows.some(r=>r.employee===id)){const row=makeRow(employee(id));row.attendance='Nepažymėta';row.include=true;row.comment='';row.absenceReason='';row.resultEdited=false;row.proposedHours=null;rows.push(row);}
    form.elements.vehicle.value=previous.vehicle||'';form.elements.driver.value=previous.driver||'';
    const notice=$('#sheet-copy-notice');notice.hidden=false;notice.textContent=`Paimta ${previous.sourceDate} dirbusios komandos sudėtis, objektas ir automobilis. Naujoms eilutėms pažymėkite šiandienos dalyvavimą; neatvykimai ir darbo įvertinimai nekopijuoti. Jau įvesti šios dienos duomenys palikti.`;
    drawRows();
  };
  loadContext();
}
