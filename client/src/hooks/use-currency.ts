import { useQuery } from "@tanstack/react-query";

interface OrgCurrency {
  currency: string;
  currencySymbol: string;
}

// Fallback rates (used only if live API fails)
const FALLBACK_RATES_FROM_INR: Record<string, number> = {
  INR: 1,
  USD: 0.01190,
  EUR: 0.01087,
  GBP: 0.00935,
  AED: 0.04370,
  SAR: 0.04464,
  SGD: 0.01587,
  AUD: 0.01852,
  CAD: 0.01613,
  BDT: 1.3095,
  NPR: 1.6,
  PKR: 3.31,
};

const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
  SAR: "en-SA",
  SGD: "en-SG",
  AUD: "en-AU",
  CAD: "en-CA",
  BDT: "en-US",
  NPR: "en-IN",
  PKR: "en-PK",
};

// Fetch live rates from free API (no API key required, hosted on CDN)
async function fetchLiveRates(): Promise<Record<string, number>> {
  const res = await fetch(
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.min.json"
  );
  if (!res.ok) throw new Error("rate fetch failed");
  const data = await res.json();
  // data.inr has lowercase currency codes: { usd: 0.01190, eur: ... }
  const raw: Record<string, number> = data.inr ?? {};
  // Normalize to uppercase keys
  const rates: Record<string, number> = { INR: 1 };
  for (const [k, v] of Object.entries(raw)) {
    rates[k.toUpperCase()] = v as number;
  }
  return rates;
}

export function useCurrency() {
  const { data: org } = useQuery<OrgCurrency | null>({
    queryKey: ["/api/auth/organization"],
  });

  // Live exchange rates — cached 6 hours, fallback to hardcoded if fails
  const { data: liveRates } = useQuery<Record<string, number>>({
    queryKey: ["exchange-rates-inr"],
    queryFn: fetchLiveRates,
    staleTime: 6 * 60 * 60 * 1000,   // 6 hours
    gcTime: 12 * 60 * 60 * 1000,      // keep in memory 12 hours
    retry: 1,
  });

  const rates = liveRates ?? FALLBACK_RATES_FROM_INR;

  const code = org?.currency ?? "INR";
  const symbol = org?.currencySymbol ?? "₹";
  const locale = CURRENCY_LOCALES[code] ?? "en-IN";
  const rate = rates[code] ?? FALLBACK_RATES_FROM_INR[code] ?? 1;

  // Convert INR-stored amount → selected currency for display
  const fmt = (inrAmount: number): string => {
    const converted = inrAmount * rate;
    const rounded = code === "INR"
      ? Math.round(converted)
      : parseFloat(converted.toFixed(2));
    return `${symbol}${rounded.toLocaleString(locale)}`;
  };

  // Convert selected-currency amount back to INR (for form inputs)
  const toINR = (amount: number): number => Math.round(amount / rate);

  return { symbol, locale, currency: code, rate, fmt, toINR };
}

export const SUPPORTED_CURRENCIES = [
  { code: "INR",  symbol: "₹",    label: "Indian Rupee (₹)" },
  { code: "USD",  symbol: "$",    label: "US Dollar ($)" },
  { code: "EUR",  symbol: "€",    label: "Euro (€)" },
  { code: "GBP",  symbol: "£",    label: "British Pound (£)" },
  { code: "AED",  symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { code: "SAR",  symbol: "﷼",   label: "Saudi Riyal (﷼)" },
  { code: "SGD",  symbol: "S$",   label: "Singapore Dollar (S$)" },
  { code: "AUD",  symbol: "A$",   label: "Australian Dollar (A$)" },
  { code: "CAD",  symbol: "C$",   label: "Canadian Dollar (C$)" },
  { code: "BDT",  symbol: "৳",    label: "Bangladeshi Taka (৳)" },
  { code: "NPR",  symbol: "Rs",   label: "Nepalese Rupee (Rs)" },
  { code: "PKR",  symbol: "₨",    label: "Pakistani Rupee (₨)" },
];
