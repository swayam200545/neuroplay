export function buildDailyPoints(rawScores, daysFilter, normalize) {
  if (!rawScores || rawScores.length === 0) return [];
  const cutoff = daysFilter
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() - daysFilter);
        return d.toISOString().split("T")[0];
      })()
    : null;

  const byDate = {};
  rawScores.forEach(({ score, date }) => {
    if (cutoff && date < cutoff) return;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(score);
  });

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      value: normalize(
        Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      ),
    }));
}
