const usd = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

/** "about $10.50 to $11.50" or "about $9.50" when both ends match. */
export function moneyRange(r: { low: number; high: number }): string {
  return r.low === r.high ? `about ${usd(r.low)}` : `about ${usd(r.low)} to ${usd(r.high)}`;
}

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** "1 sheet", "1 to 2 sheets", "40 to 80 g" */
export function quantity(low: number, high: number, unit: string): string {
  const plural = high !== 1 && /^[a-z]{3,}$/i.test(unit) && !unit.endsWith("s") ? `${unit}s` : unit;
  return low === high ? `${num(low)} ${plural}` : `${num(low)} to ${num(high)} ${plural}`;
}
