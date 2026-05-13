const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/;

const COUNTRY_SEARCH_OVERRIDES: Record<
  string,
  {
    exonym?: string;
    endonym?: string;
    aliases?: string[];
  }
> = {
  XK: {
    exonym: 'Kosovo',
    endonym: 'Kosove',
  },
};

const countrySearchTermCache = new Map<string, string[]>();

function uniqueTerms(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function toSearchTermVariants(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const asciiFolded = trimmed.normalize('NFKD').replace(/\p{M}+/gu, '');
  return uniqueTerms([trimmed, asciiFolded]);
}

function getRegionName(locale: string, code: string): string | undefined {
  try {
    const displayName = new Intl.DisplayNames([locale], {
      type: 'region',
    }).of(code);
    if (!displayName || displayName.toUpperCase() === code) {
      return undefined;
    }
    return displayName;
  } catch {
    return undefined;
  }
}

function getCountryEndonym(code: string): string | undefined {
  try {
    const locale = new Intl.Locale(`und-${code}`).maximize();
    return getRegionName(locale.baseName, code);
  } catch {
    return undefined;
  }
}

export function reverseIsoCountryCodeToNames(code: string): string[] {
  const normalized = code.trim().toUpperCase();
  if (!COUNTRY_CODE_PATTERN.test(normalized)) {
    return [];
  }

  const cached = countrySearchTermCache.get(normalized);
  if (cached) {
    return cached;
  }

  const overrides = COUNTRY_SEARCH_OVERRIDES[normalized];
  const terms = uniqueTerms([
    normalized,
    overrides?.exonym ?? getRegionName('en', normalized) ?? '',
    overrides?.endonym ?? getCountryEndonym(normalized) ?? '',
    ...(overrides?.aliases ?? []),
  ]).flatMap(toSearchTermVariants);

  const deduped = uniqueTerms(terms);
  countrySearchTermCache.set(normalized, deduped);
  return deduped;
}

export function buildCountryCodeSearchTerms(
  country: string | null | undefined,
): string[] {
  const normalized = (country ?? '').trim();
  if (!normalized || !COUNTRY_CODE_PATTERN.test(normalized)) {
    return [];
  }

  return reverseIsoCountryCodeToNames(normalized);
}
