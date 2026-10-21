// Schedules are local India calendar dates/times, not host-local timestamps.
export function fitsWasherShift(shifts, date, startTime, duration) {
  const day = new Date(date + 'T00:00:00Z');
  const minutes = value => { const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value || ''); return m && Number(m[1]) < 24 && Number(m[2]) < 60 && Number(m[3] || 0) < 60 ? Number(m[1])*60 + Number(m[2]) + Number(m[3] || 0)/60 : NaN; };
  const start = minutes(startTime), length = Number(duration);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0,10) !== date || !Number.isFinite(start) || !Number.isFinite(length) || length <= 0 || start + length > 1440) return false;
  return (shifts || []).some(shift => shift.is_available === true && Number(shift.day_of_week) === day.getUTCDay() && minutes(shift.start_time) <= start && minutes(shift.end_time) >= start + length);
}
