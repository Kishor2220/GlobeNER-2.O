export interface RegexMatch {
  text: string;
  label: "DATE" | "TIME" | "DATETIME" | "TIMESTAMP" | "EMAIL" | "PHONE" | "MONEY";
  confidence: number;
  start: number;
  end: number;
  value?: any;
  method: "regex";
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
  
  private static readonly MONTHS = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
  private static readonly CURRENCY_SYMBOLS = '₹$€£¥₩₽₦฿₫₪₱₴';
  private static readonly CURRENCY_CODES = 'INR|USD|EUR|GBP|JPY|CNY|AED|CAD|AUD|SGD|CHF|HKD|Rs';
  private static readonly CURRENCY_WORDS = 'dollars?|rupees?|pounds?|euros?|yen|dirhams?|lakhs?|crores?|millions?|billions?|trillions?';
  private static readonly NUMBER_WORDS = 'one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|trillion';

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
    const results: RegexMatch[] = [];

    // Priority Order: MONEY -> PHONE -> DATE -> TIME -> EMAIL
    this.runPattern(text, this.getMoneyPatterns(), "MONEY", results);
    this.runPattern(text, this.getPhonePatterns(), "PHONE", results);
    this.runPattern(text, this.getDatePatterns(), "DATE", results);
    this.runPattern(text, this.getTimePatterns(), "TIME", results);
    this.runPattern(text, [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g], "EMAIL", results);

    return this.resolveOverlaps(results);
  }

  private static getMoneyPatterns(): RegExp[] {
    const D = this.D;
    const S = this.CURRENCY_SYMBOLS;
    const C = this.CURRENCY_CODES;
    const W = this.CURRENCY_WORDS;
    const N = this.NUMBER_WORDS;

    return [
      // Symbol/Code before number: $1,000, INR 500, Rs. 100
      new RegExp(`(?:[${S}]|${C})\\.?\\s?${D}+(?:[,.]${D}+)*(?:\\s?(?:lakh|crore|million|billion|trillion|k|m))?`, 'gi'),
      
      // Number before word: 100 dollars, 50 lakh rupees
      new RegExp(`${D}+(?:[,.]${D}+)*\\s?(?:${W})`, 'gi'),
      
      // Number words: ten million dollars
      new RegExp(`(?:${N})(?:\\s(?:${N}))*\\s(?:${W})`, 'gi'),
      
      // Indian system specific: 10 lakh, 2 crore (without currency word sometimes implies local currency in context)
      new RegExp(`${D}+(?:[,.]${D}+)*\\s(?:lakh|crore)`, 'gi')
    ];
  }

  private static getPhonePatterns(): RegExp[] {
    const D = this.D;
    return [
      // International: +1 202-555-0183, +91 9876543210
      new RegExp(`\\+${D}{1,3}[\\s.-]?\\(?${D}{2,4}\\)?[\\s.-]?${D}{3,4}[\\s.-]?${D}{4}(?:\\s?(?:ext|x)\\s?${D}+)?`, 'g'),
      
      // Local with area code: (202) 555-0183, 080-12345678
      new RegExp(`\\(?${D}{2,4}\\)?[\\s.-]?${D}{3,4}[\\s.-]?${D}{4}`, 'g'),
      
      // Plain 10-digit: 9876543210
      new RegExp(`(?<=^|\\s)${D}{10}(?=\\s|$)`, 'g')
    ];
  }

  private static getDatePatterns(): RegExp[] {
    const D = this.D;
    const M = this.MONTHS;
    const S = '[\\s\\-\\/\\.]';

    return [
      // ISO: 2024-01-20
      new RegExp(`${D}{4}-${D}{2}-${D}{2}(?:T${D}{2}:${D}{2}:${D}{2})?`, 'gi'),
      
      // Numeric: DD/MM/YYYY, MM-DD-YYYY, YYYY.MM.DD
      new RegExp(`${D}{1,4}${S}${D}{1,2}${S}${D}{1,4}`, 'g'),
      
      // Month names: 15 Aug 2023, Aug 15, 2023
      new RegExp(`${D}{1,2}\\s(?:${M})[a-z]*\\s${D}{2,4}`, 'gi'),
      new RegExp(`(?:${M})[a-z]*\\s${D}{1,2},?\\s${D}{2,4}`, 'gi')
    ];
  }

  private static getTimePatterns(): RegExp[] {
    const D = this.D;
    return [
      // 14:30, 10:30 AM, 14:45:00Z
      new RegExp(`${D}{1,2}:${D}{2}(?::${D}{2})?(?:\\s?[aApP][mM]|Z)?`, 'gi')
    ];
  }

  private static runPattern(text: string, patterns: RegExp[], label: any, results: RegexMatch[]) {
    patterns.forEach(regex => {
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        
        // Validation Layer
        if (!this.validate(matchedText, label)) continue;

        results.push({
          text: matchedText,
          label: label,
          confidence: 1.0,
          start: match.index,
          end: match.index + matchedText.length,
          method: "regex"
        });
      }
    });
  }

  private static validate(text: string, label: string): boolean {
    const clean = text.trim();
    if (clean.length < 3 && label !== "TIME") return false;

    switch (label) {
      case "MONEY":
        // Must have a symbol, code, or currency word
        const hasSymbol = new RegExp(`[${this.CURRENCY_SYMBOLS}]`).test(clean);
        const hasCode = new RegExp(this.CURRENCY_CODES, 'i').test(clean);
        const hasWord = new RegExp(this.CURRENCY_WORDS, 'i').test(clean);
        const hasIndianUnit = /lakh|crore/i.test(clean);
        return hasSymbol || hasCode || hasWord || hasIndianUnit;

      case "PHONE":
        const digits = this.normalizeDigits(clean).replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 15;

      case "DATE":
        // Basic range validation for numeric dates
        const normalized = this.normalizeDigits(clean);
        if (/^\d{1,4}[\s\-\/\.]\d{1,2}[\s\-\/\.]\d{1,4}$/.test(normalized)) {
          const parts = normalized.split(/[\s\-\/\.]/).map(p => parseInt(p));
          const hasDay = parts.some(p => p >= 1 && p <= 31);
          const hasMonth = parts.some(p => p >= 1 && p <= 12);
          const hasYear = parts.some(p => p > 1900 && p < 2100) || parts.some(p => p >= 0 && p <= 99);
          return hasDay && hasMonth && hasYear;
        }
        return true;

      case "TIME":
        return clean.includes(':');

      default:
        return true;
    }
  }

  private static resolveOverlaps(matches: RegexMatch[]): RegexMatch[] {
    if (matches.length === 0) return [];

    // Sort: 1. Start index (asc), 2. Length (desc), 3. Priority (MONEY > PHONE > DATE > TIME)
    const priority: Record<string, number> = { "MONEY": 4, "PHONE": 3, "DATE": 2, "TIME": 1, "EMAIL": 0 };
    
    const sorted = matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      const lenA = a.end - a.start;
      const lenB = b.end - b.start;
      if (lenA !== lenB) return lenB - lenA;
      return (priority[b.label] || 0) - (priority[a.label] || 0);
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
