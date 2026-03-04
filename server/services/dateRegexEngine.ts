import { logger } from "../logger";

export interface DateMatch {
  text: string;
  label: "DATE";
  value: string; // ISO YYYY-MM-DD or YYYY
  is_year_only: boolean;
  confidence: number;
  start: number;
  end: number;
  method: "regex";
}

export class DateRegexEngine {
  private static readonly MONTHS_MAP: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
    nov: 11, november: 11, dec: 12, december: 12
  };

  private static readonly MONTHS_REGEX = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

  /**
   * Main extraction method for DATE entities
   */
  static extract(text: string): DateMatch[] {
    const results: DateMatch[] = [];
    try {
      const patterns = this.getPatterns();
      patterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null) {
          const matchedText = match[0];
          
          // Pre-validation: Avoid IP addresses and Versions
          if (this.isIpAddress(matchedText)) continue;
          if (this.isVersionNumber(text, match.index)) continue;

          const normalized = this.normalize(matchedText);
          if (normalized) {
            results.push({
              text: matchedText,
              label: "DATE",
              value: normalized.iso,
              is_year_only: normalized.isYearOnly,
              confidence: 0.95,
              start: match.index,
              end: match.index + matchedText.length,
              method: "regex"
            });
          }
        }
      });
    } catch (err) {
      logger.error("Date extraction failed", "DateRegexEngine", err);
    }
    return results;
  }

  private static getPatterns(): RegExp[] {
    const M = this.MONTHS_REGEX;
    
    return [
      // 1. ISO: 2025-03-02, 2025/03/02
      /\b\d{4}[-/]\d{2}[-/]\d{2}\b/g,
      
      // 2. European/US Numeric: 02/03/2025, 03-02-2025, 2.3.2025
      /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g,
      
      // 3. Long form: 2 March 2025, 15 August 1947, 02 Mar 2025
      new RegExp(`\\b\\d{1,2}\\s+(?:${M})\\s+\\d{2,4}\\b`, 'gi'),
      
      // 4. US Long form: March 2, 2025
      new RegExp(`\\b(?:${M})\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{2,4}\\b`, 'gi'),
      
      // 5. Day-Month only: 2 March, 15 Aug
      new RegExp(`\\b\\d{1,2}\\s+(?:${M})\\b`, 'gi'),
      
      // 6. Month-Day only: March 2
      new RegExp(`\\b(?:${M})\\s+\\d{1,2}\\b`, 'gi'),
      
      // 7. Year only: 1999, 2025 (Strict 4 digits, 1000-2100)
      /\b(?:1\d{3}|20\d{2}|2100)\b/g,
      
      // 8. DOB formats (Contextual)
      new RegExp(`(?:DOB|Date of Birth|Born on)[:\\s]+\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4}`, 'gi')
    ];
  }

  private static isIpAddress(text: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(text);
  }

  private static isVersionNumber(fullText: string, index: number): boolean {
    // Check if preceded by 'v' or 'version'
    const prefix = fullText.slice(Math.max(0, index - 10), index).toLowerCase();
    if (/(?:v|version|ver)\s*$/i.test(prefix)) return true;
    
    // Check if followed by another dot and number (e.g. 1.2.3)
    // This is tricky because some dates use dots. 
    // But usually dates are 2.3.2025 (3 segments). Versions are often 1.2.3.4 or have small numbers.
    return false;
  }

  private static normalize(text: string): { iso: string; isYearOnly: boolean } | null {
    try {
      const clean = text.replace(/(?:DOB|Date of Birth|Born on)[:\s]+/i, '').trim();
      
      // 1. Year Only
      if (/^\d{4}$/.test(clean)) {
        const year = parseInt(clean);
        if (year >= 1000 && year <= 2100) {
          return { iso: clean, isYearOnly: true };
        }
        return null;
      }

      // 2. ISO: YYYY-MM-DD
      const isoMatch = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
      if (isoMatch) {
        const [_, y, m, d] = isoMatch;
        if (this.isValid(parseInt(d), parseInt(m), parseInt(y))) {
          return { iso: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, isYearOnly: false };
        }
      }

      // 3. Numeric: DD/MM/YYYY or MM/DD/YYYY
      const numericMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
      if (numericMatch) {
        let [_, p1, p2, p3] = numericMatch;
        let d = parseInt(p1);
        let m = parseInt(p2);
        let y = parseInt(p3);

        if (y < 100) y += (y > 30 ? 1900 : 2000); // Simple 2-digit year logic

        // Disambiguate US (MM/DD) vs Euro (DD/MM)
        // If p1 > 12, it must be Euro (DD/MM)
        // If p2 > 12, it must be US (MM/DD)
        // If both <= 12, default to Euro (DD/MM) as requested by "European" requirement being listed first
        if (d > 12 && m <= 12) {
          // Euro DD/MM/YYYY
        } else if (m > 12 && d <= 12) {
          // US MM/DD/YYYY
          [d, m] = [m, d];
        }

        if (this.isValid(d, m, y)) {
          return { iso: `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`, isYearOnly: false };
        }
      }

      // 4. Long Form: 2 March 2025 or March 2, 2025
      const monthRegex = new RegExp(this.MONTHS_REGEX, 'i');
      const monthMatch = clean.match(monthRegex);
      if (monthMatch) {
        const monthName = monthMatch[0].toLowerCase();
        const m = this.MONTHS_MAP[monthName] || this.MONTHS_MAP[monthName.slice(0, 3)];
        
        const dayMatch = clean.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
        const yearMatch = clean.match(/\b(\d{4})\b/);
        
        const d = dayMatch ? parseInt(dayMatch[1]) : 1; // Default to 1 if day-month only? No, user said "Day-Month only"
        const y = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        const isYearOnly = false;

        if (this.isValid(d, m, y)) {
          return { iso: `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`, isYearOnly };
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  }

  private static isValid(d: number, m: number, y: number): boolean {
    if (y < 1000 || y > 2100) return false;
    if (m < 1 || m > 12) return false;
    const daysInMonth = new Date(y, m, 0).getDate();
    return d >= 1 && d <= daysInMonth;
  }
}
