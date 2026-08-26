// Money / number formatting helpers. All money uses tabular numerals in the UI.

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(n: number): string {
  return usd0.format(Math.round(n));
}

export function money2(n: number): string {
  return usd2.format(n);
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function num(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
