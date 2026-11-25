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
    return records.filter(row => row.id !== ignoreId && row.employee === candidate.employee && row.date === candidate.date && (
      row.attendance !== 'Dirbo' || candidate.attendance !== 'Dirbo' || (candidate.start < row.end && candidate.end > row.start)
    ));
  }
  root.WorkRules = { round, minutes, calculate, teamAverage, proposal, conflicts };
})(globalThis);
