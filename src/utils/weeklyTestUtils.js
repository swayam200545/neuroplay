export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fakeSequences(correct) {
  const opts = [correct];
  while (opts.length < 4) {
    const fake = correct
      .split("")
      .map((d, i) =>
        Math.random() < 0.4 ? String(Math.floor(Math.random() * 10)) : d,
      )
      .join("");
    if (!opts.includes(fake)) opts.push(fake);
  }
  return shuffle(opts);
}

export function fakeAnswers(correct) {
  const opts = [correct];
  while (opts.length < 4) {
    const delta = Math.floor(Math.random() * 20) + 1;
    const fake =
      Math.random() < 0.5 ? correct + delta : Math.abs(correct - delta);
    if (!opts.includes(fake)) opts.push(fake);
  }
  return shuffle(opts);
}
