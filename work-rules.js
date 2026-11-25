/* Pure calculations shared by the prototype and its checks. */
(function (root) {
  const round = n => Math.round(n * 100) / 100;
  const minutes = t => { if (!/^\d{2}:\d{2}$/.test(t || '')) return NaN; const [h,m] = t.split(':').map(Number); return h < 24 && m < 60 ? h * 60 + m : NaN; };
  function calculate(record) {
    if (record.attendance && record.attendance !== 'Dirbo') return { gross: 0, lunch: 0, actual: 0 };
    const start = minutes(record.start), end = minutes(record.end), lunchStart = minutes(record.lunchStart || '12:00');
    if (![start,end,lunchStart].every(Number.isFinite) || end <= start) throw Error('Patikrinkite pradžios, pabaigos ir pietų laiką. Intervalas turi baigtis tą pačią dieną.');
    const lunch = Math.max(0, Math.min(end, lunchStart + 30) - Math.max(start, lunchStart));
    return { gross: round((end-start)/60), lunch, actual: round((end-start-lunch)/60) };
  }
  function teamAverage(records, record) {
    const cohort = new Set(records.filter(row => row.employee !== record.employee && row.date === record.date && row.team === record.team && row.attendance === 'Dirbo').map(row => row.employee));
    const people = new Map();
    for (const row of records) {
      if (!cohort.has(row.employee) || row.date !== record.date || row.attendance !== 'Dirbo') continue;
      people.set(row.employee, (people.get(row.employee) || 0) + calculate(row).actual);
    }
    return { value: people.size ? round([...people.values()].reduce((a,b)=>a+b,0)/people.size) : null, people: people.size };
  }
  function proposal(records, record) {
    const actual = calculate(record).actual;
    if (record.status === 'Patvirtinta' && record.approvedProposal) return { actual, ...record.approvedProposal };
    if (record.attendance === 'Nepateisintas neatvykimas') {
      const average = teamAverage(records, record);
      return { actual, value: average.value === null ? null : -average.value, delta: average.value === null ? null : -average.value, reference: average };
    }
    const value = record.proposedHours === null || record.proposedHours === undefined || record.proposedHours === '' ? actual : Number(record.proposedHours);
    return { actual, value: round(value), delta: round(value-actual), reference: null };
  }
  function conflicts(records, candidate, ignoreId) {
    return records.filter(row => (ignoreId == null || row.id !== ignoreId) && row.employee === candidate.employee && row.date === candidate.date && (
      row.attendance !== 'Dirbo' || candidate.attendance !== 'Dirbo' || (candidate.start < row.end && candidate.end > row.start)
    ));
  }
  function validateBatch(records, candidates, requireComments = true) {
    const replaced = new Set(candidates.filter(r=>r.id != null).map(r=>r.id));
    const remaining = records.filter(r=>!replaced.has(r.id));
    const all = [...remaining, ...candidates];
    for (const row of candidates) {
      if (!['Dirbo','Nepateisintas neatvykimas','Pateisintas neatvykimas'].includes(row.attendance)) throw Error(`Darbuotojas #${row.employee}: pažymėkite dalyvavimą.`);
      const c = calculate(row);
      if (row.proposedHours !== null && row.proposedHours !== undefined && row.proposedHours !== '' && (!Number.isFinite(Number(row.proposedHours)) || Number(row.proposedHours) < 0 || Number(row.proposedHours) > 24)) throw Error(`Darbuotojas #${row.employee}: atlikto darbo valandos turi būti nuo 0 iki 24.`);
      if (requireComments && row.attendance === 'Pateisintas neatvykimas' && !row.absenceReason) throw Error(`Darbuotojas #${row.employee}: pasirinkite pateisinto neatvykimo priežastį.`);
      if (requireComments && row.attendance === 'Dirbo' && row.proposedHours != null && Number(row.proposedHours) !== c.actual && !(row.comment||'').trim()) throw Error(`Darbuotojas #${row.employee}: paaiškinkite dirbtų ir atlikto darbo valandų skirtumą.`);
      const others = all.filter(r=>r !== row);
      if (conflicts(others,row).length) throw Error(`Darbuotojas #${row.employee}: sutampa darbo intervalai arba šiai dienai jau pažymėtas neatvykimas.`);
      if (row.attendance === 'Dirbo' && others.some(r=>r.employee===row.employee&&r.date===row.date&&r.attendance==='Dirbo'&&r.lunchStart!==row.lunchStart)) throw Error(`Darbuotojas #${row.employee}: visuose dienos įrašuose pietų pradžia turi sutapti.`);
      if (row.attendance === 'Dirbo' && row.vehicle && others.some(r=>r.vehicle===row.vehicle&&r.team!==row.team&&r.date===row.date&&r.attendance==='Dirbo'&&row.start<r.end&&row.end>r.start)) throw Error('Automobilis tuo pačiu laiku priskirtas kitai komandai.');
    }
    return candidates;
  }
  const assessed = row => row.attendance === 'Dirbo' ? proposal([],row).value : 0;
  const absenceAdjustment = (records,row) => row.attendance === 'Nepateisintas neatvykimas' ? proposal(records,row).value : 0;
  function daySummary(records,employee,date,referenceRecords=records) {
    const rows=records.filter(r=>r.employee===employee&&r.date===date).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
    return { rows, actual:round(rows.reduce((s,r)=>s+calculate(r).actual,0)), assessed:round(rows.reduce((s,r)=>s+assessed(r),0)), absenceAdjustment:round(rows.reduce((s,r)=>s+(absenceAdjustment(referenceRecords,r)||0),0)), projects:[...new Set(rows.map(r=>r.project))], draft:rows.some(r=>r.status==='Juodraštis') };
  }
  function coverage(records,employees,teams,date) {
    const daily=records.filter(r=>r.date===date);
    const people=employees.filter(e=>e.active!==false).map(e=>{
      const rows=daily.filter(r=>r.employee===e.id);
      return {...e,rows,attendance:!rows.length?'Nepažymėta':rows.some(r=>r.attendance==='Dirbo')?'Dirbo':rows[0].attendance,status:!rows.length?'Nepažymėta':rows.some(r=>r.status==='Juodraštis')?'Juodraštis':'Pateikta'};
    });
    const teamRows=teams.map(t=>{const members=people.filter(e=>e.team===t.id);return {...t,members,missing:members.filter(e=>!e.rows.length),draft:members.filter(e=>e.status==='Juodraštis'),status:members.some(e=>!e.rows.length)?'Trūksta duomenų':members.some(e=>e.status==='Juodraštis')?'Juodraštis':'Pateikta'};});
    return {people,teams:teamRows,worked:people.filter(e=>e.attendance==='Dirbo').length,unexcused:people.filter(e=>e.attendance==='Nepateisintas neatvykimas').length,excused:people.filter(e=>e.attendance==='Pateisintas neatvykimas').length,missing:people.filter(e=>!e.rows.length),draft:people.filter(e=>e.status==='Juodraštis')};
  }
  function previousRoster(records,author,team,date) {
    const past=records.filter(r=>r.author===author&&r.team===team&&r.date<date&&r.attendance==='Dirbo');
    if(!past.length)return null;
    const sourceDate=past.map(r=>r.date).sort().at(-1),rows=past.filter(r=>r.date===sourceDate);
    const most=key=>{const counts=new Map();for(const r of rows)if(r[key]!=null)counts.set(r[key],(counts.get(r[key])||0)+1);return [...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]??null;};
    return {sourceDate,employeeIds:[...new Set(rows.map(r=>r.employee))],project:most('project'),vehicle:most('vehicle'),driver:most('driver')};
  }
  function transfer(records,ids,settings) {
    if(settings.sourceProject===settings.targetProject)throw Error('Pasirinkite kitą tikslinį objektą.');
    const changes=[];
    for(const employee of ids){
      const matches=records.filter(r=>r.employee===employee&&r.date===settings.date&&r.project===settings.sourceProject&&r.attendance==='Dirbo'&&r.start<settings.at&&r.end>settings.at);
      if(matches.length!==1)throw Error(`Darbuotojas #${employee}: pasirinktu laiku nėra vieno tinkamo darbo intervalo.`);
      const row=matches[0];
      if(row.status!=='Juodraštis'||(!settings.corrector&&row.author!==settings.actor))throw Error('Perkelti galima tik savo neperduoto juodraščio darbuotojus.');
      const before={...row,end:settings.at,status:'Juodraštis',approvedProposal:null};
      const after={...row,id:undefined,start:settings.at,project:settings.targetProject,author:settings.targetAuthor,team:settings.targetTeam,vehicle:settings.vehicle===undefined?row.vehicle:settings.vehicle,driver:settings.driver===undefined?row.driver:settings.driver,status:'Juodraštis',approvedProposal:null};
      const total=calculate(row).actual,first=calculate(before).actual;
      if(row.proposedHours!=null&&total>0){before.proposedHours=round(Number(row.proposedHours)*first/total);after.proposedHours=round(Number(row.proposedHours)-before.proposedHours);}
      changes.push(before,after);
    }
    if(!changes.length)throw Error('Pasirinkite bent vieną darbuotoją.');
    validateBatch(records,changes,false);
    return changes;
  }
  root.WorkRules = { round, minutes, calculate, teamAverage, proposal, conflicts, validateBatch, assessed, absenceAdjustment, daySummary, coverage, previousRoster, transfer };
})(globalThis);
