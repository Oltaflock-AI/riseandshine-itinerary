export function fxRate(): number {
  const r = Number(process.env.USD_INR_RATE);
  return Number.isFinite(r) && r > 0 ? r : 85.5;
}

export function inr(usd: number, fx = fxRate()): string {
  return "₹" + Math.round(usd * fx).toLocaleString("en-IN");
}

export function usd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}
