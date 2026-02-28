/**
 * RegexService
 * Specialized service for high-precision extraction of Dates, Times, Datetimes, and Timestamps.
 * Supports multilingual numerals (Arabic, Hindi, Kannada) and a wide array of international formats.
 */

export interface RegexMatch {
  text: string;
  label: "DATE" | "TIME" | "DATETIME" | "TIMESTAMP" | "EMAIL" | "PHONE" | "MONEY";
  confidence: number;
  start: number;
  end: number;
}

export class RegexService {
  // Multilingual digit support: 
  // Arabic (0-9), Hindi (०-९), Kannada (೦-೯), Tamil (௦-௯), Telugu (౦-౯), 
  // Malayalam (൦-൯), Bengali (০-৯), Gujarati (૦-૯), Gurmukhi (੦-੯), 
  // Thai (๐-๙), Arabic-Indic (٠-٩), Persian (۰-۹), Full-width (０-９)
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
  
  // Month names and abbreviations
  private static readonly MONTHS = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
  
  // Separators
  private static readonly SEP = '[\\s\\-\\/\\.]';

  /**
   * Main extraction method
   */
  static extract(text: string): RegexMatch[] {
    const results: RegexMatch[] = [];

    // 1. DATETIME (ISO 8601 & Combinations) - Highest priority
    this.runPattern(text, this.getDateTimePatterns(), "DATETIME", results);

    // 2. TIMESTAMPS (Unix)
    this.runPattern(text, this.getTimestampPatterns(), "TIMESTAMP", results);

    // 3. DATE
    this.runPattern(text, this.getDatePatterns(), "DATE", results);

    // 4. TIME
    this.runPattern(text, this.getTimePatterns(), "TIME", results);

    // 5. OTHER (Email, Phone, Money)
    this.runPattern(text, [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g], "EMAIL", results);
    this.runPattern(text, [/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g], "PHONE", results);
    this.runPattern(text, [/([₹$€£¥]|USD|INR|EUR)\s?\d+([,.]\d+)?/g], "MONEY", results);

    // Deduplicate and resolve overlaps (prefer longer matches)
    return this.resolveOverlaps(results);
  }

  /**
   * Normalizes multilingual digits to standard Arabic digits (0-9)
   */
  static normalizeDigits(text: string): string {
    return text.replace(/[\u0966-\u096F\u0CE6-\u0CEF\u0BE6-\u0BEF\u0C66-\u0C6F\u0D66-\u0D6F\u09E6-\u09EF\u0AE6-\u0AEF\u0A66-\u0A6F\u0E50-\u0E59\u0660-\u0669\u06F0-\u06F9\uFF10-\uFF19]/g, (char) => {
      const code = char.charCodeAt(0);
      // Blocks of 10 digits in Unicode
      if (code >= 0x0966 && code <= 0x096F) return (code - 0x0966).toString(); // Hindi
      if (code >= 0x0CE6 && code <= 0x0CEF) return (code - 0x0CE6).toString(); // Kannada
      if (code >= 0x0BE6 && code <= 0x0BEF) return (code - 0x0BE6).toString(); // Tamil
      if (code >= 0x0C66 && code <= 0x0C6F) return (code - 0x0C66).toString(); // Telugu
      if (code >= 0x0D66 && code <= 0x0D6F) return (code - 0x0D66).toString(); // Malayalam
      if (code >= 0x09E6 && code <= 0x09EF) return (code - 0x09E6).toString(); // Bengali
      if (code >= 0x0AE6 && code <= 0x0AEF) return (code - 0x0AE6).toString(); // Gujarati
      if (code >= 0x0A66 && code <= 0x0A6F) return (code - 0x0A66).toString(); // Gurmukhi
      if (code >= 0x0E50 && code <= 0x0E59) return (code - 0x0E50).toString(); // Thai
      if (code >= 0x0660 && code <= 0x0669) return (code - 0x0660).toString(); // Arabic-Indic
      if (code >= 0x06F0 && code <= 0x06F9) return (code - 0x06F0).toString(); // Persian
      if (code >= 0xFF10 && code <= 0xFF19) return (code - 0xFF10).toString(); // Full-width
      return char;
    });
  }

  private static runPattern(text: string, patterns: RegExp[], label: any, results: RegexMatch[]) {
    patterns.forEach(regex => {
      let match;
      // Reset regex index for global flags
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        results.push({
          text: match[0],
          label: label || (match as any).groups?.label || "UNKNOWN",
          confidence: 1.0,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
  }

  private static getDateTimePatterns(): RegExp[] {
    const D = this.D;
    const S = this.SEP;
    const M = this.MONTHS;

    return [
      // ISO 8601: YYYY-MM-DDTHH:mm:ss.SSSZ
      new RegExp(`(?<=^|[^\\d])${D}{4}-${D}{2}-${D}{2}T${D}{2}:${D}{2}:${D}{2}(?:\\.${D}+)?(?:Z|[+-]${D}{2}:?${D}{2})?(?=[^\\d]|$)`, 'gi'),
      
      // Common combinations: YYYY-MM-DD HH:mm:ss
      new RegExp(`(?<=^|[^\\d])${D}{4}${S}${D}{2}${S}${D}{2}\\s+${D}{2}:${D}{2}(?::${D}{2})?(?:\\s*[aApP][mM])?(?=[^\\d]|$)`, 'gi'),
      
      // DD-MM-YYYY HH:mm:ss
      new RegExp(`(?<=^|[^\\d])${D}{1,2}${S}${D}{1,2}${S}${D}{2,4}\\s+${D}{2}:${D}{2}(?::${D}{2})?(?:\\s*[aApP][mM])?(?=[^\\d]|$)`, 'gi'),
      
      // DD Mon YYYY HH:mm:ss
      new RegExp(`(?<=^|[^\\d])${D}{1,2}${S}(?:${M})${S}${D}{2,4}\\s+${D}{2}:${D}{2}(?::${D}{2})?(?:\\s*[aApP][mM])?(?=[^\\d]|$)`, 'gi'),

      // Mon DD, YYYY HH:mm:ss
      new RegExp(`(?<=^|[^\\d])(?:${M})${S}${D}{1,2},?${S}${D}{2,4}\\s+${D}{2}:${D}{2}(?::${D}{2})?(?:\\s*[aApP][mM])?(?=[^\\d]|$)`, 'gi'),
      
      // Compact: YYYYMMDDHHmmss
      new RegExp(`(?<=^|[^\\d])${D}{14}(?:${D}{3})?(?=[^\\d]|$)`, 'g'),
    ];
  }

  private static getDatePatterns(): RegExp[] {
    const D = this.D;
    const S = this.SEP;
    const M = this.MONTHS;

    return [
      // YYYY-MM-DD, DD-MM-YYYY, MM-DD-YYYY
      new RegExp(`(?<=^|[^\\d])${D}{4}${S}${D}{1,2}${S}${D}{1,2}(?=[^\\d]|$)`, 'g'),
      new RegExp(`(?<=^|[^\\d])${D}{1,2}${S}${D}{1,2}${S}${D}{2,4}(?=[^\\d]|$)`, 'g'),
      
      // DD Mon YYYY, Mon DD YYYY
      new RegExp(`(?<=^|[^\\d])${D}{1,2}${S}(?:${M})${S}${D}{2,4}(?=[^\\d]|$)`, 'gi'),
      new RegExp(`(?<=^|[^\\d])(?:${M})${S}${D}{1,2},?${S}${D}{2,4}(?=[^\\d]|$)`, 'gi'),
      
      // YYYY Mon DD
      new RegExp(`(?<=^|[^\\d])${D}{4}${S}(?:${M})${S}${D}{1,2}(?=[^\\d]|$)`, 'gi'),

      // ISO Week / Day of Year
      new RegExp(`(?<=^|[^\\d])${D}{4}-W${D}{2}-${D}(?=[^\\d]|$)`, 'gi'),
      new RegExp(`(?<=^|[^\\d])${D}{4}-${D}{3}(?=[^\\d]|$)`, 'g'),
    ];
  }

  private static getTimePatterns(): RegExp[] {
    const D = this.D;
    return [
      // HH:mm:ss.SSS Z
      new RegExp(`(?<=^|[^\\d])${D}{1,2}:${D}{2}(?::${D}{2}(?:\\.${D}+)?)?(?:\\s*[aApP][mM])?(?:\\s*(?:Z|[+-]${D}{2}:?${D}{2}))?(?=[^\\d]|$)`, 'gi'),
      
      // Removed overly broad HHmmss pattern to prevent mis-labeling numbers as TIME
    ];
  }

  private static getTimestampPatterns(): RegExp[] {
    return [
      // Unix Seconds (10), Millis (13), Nanos (19)
      /(?<=^|[^\d])\d{10}(?=[^\d]|$)/g,
      /(?<=^|[^\d])\d{13}(?=[^\d]|$)/g,
      /(?<=^|[^\d])\d{19}(?=[^\d]|$)/g,
    ];
  }

  private static resolveOverlaps(matches: RegexMatch[]): RegexMatch[] {
    if (matches.length === 0) return [];

    // Sort by start index, then by length (descending)
    const sorted = matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - a.end;
    });

    const result: RegexMatch[] = [];
    let lastEnd = -1;

    for (const match of sorted) {
      if (match.start >= lastEnd) {
        result.push(match);
        lastEnd = match.end;
      }
    }

    return result;
  }
}
