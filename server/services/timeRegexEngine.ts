import { logger } from "../logger";

export interface TimeMatch {
  text: string;
  label: "TIME";
  value: string; // HH:MM:SS (24h format)
  confidence: number;
  start: number;
  end: number;
  method: "regex";
}

export class TimeRegexEngine {
  /**
   * Main extraction method for TIME entities
   */
  static extract(text: string): TimeMatch[] {
    const results: TimeMatch[] = [];
    try {
      const patterns = this.getPatterns();
      patterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null) {
          const matchedText = match[0];
          
          // Avoid matching plain numbers that look like years or large amounts
          if (this.isPlainNumber(matchedText)) continue;

          const normalized = this.normalize(matchedText);
          if (normalized) {
            results.push({
              text: matchedText,
              label: "TIME",
              value: normalized,
              confidence: 0.95,
              start: match.index,
              end: match.index + matchedText.length,
              method: "regex"
            });
          }
        }
      });
    } catch (err) {
      logger.error("Time extraction failed", "TimeRegexEngine", err);
    }
    return results;
  }

  private static getPatterns(): RegExp[] {
    return [
      // 1. 24-hour or 12-hour with minutes (and optional seconds/AM-PM/Timezone)
      // Supports: 14:30, 23:59:59, 2:30 PM, 11:45am, 14:30 IST, 09:15 +05:30
      /\b(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s*(?:[aApP][mM]|[A-Z]{3,4}|[+-]\d{2}:?\d{2}))?\b/gi,
      
      // 2. 12-hour standalone hour with AM/PM: 7 PM, 12am
      /\b(?:1[0-2]|0?[1-9])\s*(?:[aApP][mM])\b/gi
    ];
  }

  private static isPlainNumber(text: string): boolean {
    // If it's just digits without any separators or indicators, it's a plain number
    return /^\d+$/.test(text);
  }

  private static normalize(text: string): string | null {
    try {
      const clean = text.trim().toLowerCase();
      
      // Extract components
      const timePart = clean.match(/(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?/);
      if (!timePart) return null;

      let h = parseInt(timePart[1]);
      let m = timePart[2] ? parseInt(timePart[2]) : 0;
      let s = timePart[3] ? parseInt(timePart[3]) : 0;

      const isPm = clean.includes('pm');
      const isAm = clean.includes('am');

      // 12-hour conversion
      if (isPm || isAm) {
        if (h < 1 || h > 12) return null; // Invalid 12h hour
        if (isPm && h < 12) h += 12;
        if (isAm && h === 12) h = 0;
      } else {
        // 24-hour validation
        if (h < 0 || h > 23) return null;
      }

      // General validation
      if (m < 0 || m > 59) return null;
      if (s < 0 || s > 59) return null;

      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } catch (err) {
      return null;
    }
  }
}
