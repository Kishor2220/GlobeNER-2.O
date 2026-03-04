import { MoneyRegexEngine } from "./moneyRegexEngine";
import { DateRegexEngine } from "./dateRegexEngine";
import { TimeRegexEngine } from "./timeRegexEngine";
import { EmailRegexEngine } from "./emailRegexEngine";
import { PhoneRegexEngine } from "./phoneRegexEngine";
import { DobRegexEngine } from "./dobRegexEngine";
import { OverlapResolutionService } from "./overlapResolutionService";

export interface RegexMatch {
  text: string;
  label: "DATE" | "TIME" | "DATETIME" | "TIMESTAMP" | "EMAIL" | "PHONE" | "MONEY" | "DATE_OF_BIRTH";
  confidence: number;
  start: number;
  end: number;
  value?: any;
  method: "regex";
  source?: "regex" | "model";
  amount_numeric?: number;
  currency?: string;
  is_year_only?: boolean;
}

export class RegexService {
  private static readonly D = '[' +
    '\\d' +                // Standard Arabic (0-9)
    '\\u0966-\\u096F' +    // Hindi/Devanagari
    '\\u0CE6-\\u0CEF' +    // Kannada
    '\\u0BE6-\\u0BEF' +    // Tamil
    '\\u0C66-\\u0C6F' +    // Telugu
    '\\u0D66-\\u0D6F' +    // Malayalam
    '\\u09E6-\\u09EF' +    // Bengali
    '\\u0AE6-\\u0AEF' +    // Gujarati
    '\\u0A66-\\u0A6F' +    // Gurmukhi (Punjabi)
    '\\u0E50-\\u0E59' +    // Thai
    '\\u0660-\\u0669' +    // Arabic-Indic
    '\\u06F0-\\u06F9' +    // Persian (Extended Arabic-Indic)
    '\\uFF10-\\uFF19' +    // Full-width (Chinese/Japanese)
  ']';
  
  /**
   * Normalizes text for better matching:
   * - Unicode NFKC normalization (converts full-width to ASCII)
   * - Removes zero-width spaces
   * - Standardizes quotes
   */
  static normalizeText(text: string): string {
    if (!text) return "";
    
    // 1. Unicode Normalization (NFKC)
    // This handles full-width digits and characters
    let normalized = text.normalize("NFKC");

    // 2. Remove Zero-Width Spaces
    normalized = normalized.replace(/[\u200B\u200C\u200D\uFEFF]/g, "");

    // 3. Standardize Quotes
    normalized = normalized.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
    normalized = normalized.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

    // 4. Multilingual Digit Normalization
    normalized = this.normalizeDigits(normalized);

    return normalized;
  }

  /**
   * Normalizes multilingual digits to standard Arabic digits (0-9)
   */
  static normalizeDigits(text: string): string {
    return text.replace(/[\u0966-\u096F\u0CE6-\u0CEF\u0BE6-\u0BEF\u0C66-\u0C6F\u0D66-\u0D6F\u09E6-\u09EF\u0AE6-\u0AEF\u0A66-\u0A6F\u0E50-\u0E59\u0660-\u0669\u06F0-\u06F9\uFF10-\uFF19]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x0966 && code <= 0x096F) return (code - 0x0966).toString();
      if (code >= 0x0CE6 && code <= 0x0CEF) return (code - 0x0CE6).toString();
      if (code >= 0x0BE6 && code <= 0x0BEF) return (code - 0x0BE6).toString();
      if (code >= 0x0C66 && code <= 0x0C6F) return (code - 0x0C66).toString();
      if (code >= 0x0D66 && code <= 0x0D6F) return (code - 0x0D66).toString();
      if (code >= 0x09E6 && code <= 0x09EF) return (code - 0x09E6).toString();
      if (code >= 0x0AE6 && code <= 0x0AEF) return (code - 0x0AE6).toString();
      if (code >= 0x0A66 && code <= 0x0A6F) return (code - 0x0A66).toString();
      if (code >= 0x0E50 && code <= 0x0E59) return (code - 0x0E50).toString();
      if (code >= 0x0660 && code <= 0x0669) return (code - 0x0660).toString();
      if (code >= 0x06F0 && code <= 0x06F9) return (code - 0x06F0).toString();
      if (code >= 0xFF10 && code <= 0xFF19) return (code - 0xFF10).toString();
      return char;
    });
  }

  static extract(text: string): RegexMatch[] {
    const normalizedText = this.normalizeText(text);
    const results: RegexMatch[] = [];

    // 1. MONEY (Dedicated Engine)
    const moneyMatches = MoneyRegexEngine.extract(normalizedText);
    results.push(...moneyMatches);

    // 2. DATE (Dedicated Engine)
    const dateMatches = DateRegexEngine.extract(normalizedText);
    results.push(...dateMatches);

    // 3. TIME (Dedicated Engine)
    const timeMatches = TimeRegexEngine.extract(normalizedText);
    results.push(...timeMatches);

    // 4. EMAIL (Dedicated Engine)
    const emailMatches = EmailRegexEngine.extract(normalizedText);
    results.push(...emailMatches);

    // 5. PHONE (Dedicated Engine)
    const phoneMatches = PhoneRegexEngine.extract(normalizedText);
    results.push(...phoneMatches);

    // 6. DATE_OF_BIRTH (Dedicated Engine)
    const dobMatches = DobRegexEngine.extract(normalizedText);
    results.push(...dobMatches);

    // Ensure all regex matches have the source property
    const entities = results.map(r => ({ ...r, source: "regex" as const }));

    return OverlapResolutionService.resolve(entities) as RegexMatch[];
  }
}
