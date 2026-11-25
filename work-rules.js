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
    const people = new Map();
    for (const row of records) {
      if (row.employee === record.employee || row.date !== record.date || row.team !== record.team || row.attendance !== 'Dirbo') continue;
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
  root.WorkRules = { round, minutes, calculate, teamAverage, proposal, conflicts, validateBatch };
})(globalThis);
