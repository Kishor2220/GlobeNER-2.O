import { logger } from "../logger";

export interface PhoneMatch {
  text: string;
  label: "PHONE";
  value: string; // E.164 format if possible
  confidence: number;
  start: number;
  end: number;
  method: "regex";
}

export class PhoneRegexEngine {
  /**
   * Main extraction method for PHONE entities
   */
  static extract(text: string): PhoneMatch[] {
    const results: PhoneMatch[] = [];
    try {
      const patterns = this.getPatterns();
      patterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null) {
          const matchedText = match[0];
          
          // Pre-validation: Avoid year ranges like 2020-2025
          if (this.isYearRange(matchedText)) continue;

          const normalized = this.normalize(matchedText);
          if (normalized && this.isValid(normalized)) {
            results.push({
              text: matchedText,
              label: "PHONE",
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
      logger.error("Phone extraction failed", "PhoneRegexEngine", err);
    }
    return results;
  }

  private static getPatterns(): RegExp[] {
    return [
      // 1. International with +: +1 202-555-0183, +91 98765 43210
      /\+?\d{1,3}[\s.-]?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{4,6}/g,
      
      // 2. Local with parentheses: (202) 555-0183
      /\(\d{2,5}\)[\s.-]?\d{3,5}[\s.-]?\d{4,6}/g,
      
      // 3. Plain 10-digit or local with hyphens: 9876543210, 020-7946-0958
      /\b\d{3,5}[\s.-]\d{3,5}[\s.-]\d{4,6}\b/g,
      
      // 4. Strict 10-digit mobile (India/US style): 9876543210
      /\b[6-9]\d{9}\b/g, // Mobile often starts with 6-9 in India
      /\b[2-9]\d{9}\b/g  // US often starts with 2-9
    ];
  }

  private static isYearRange(text: string): boolean {
    // Matches 2020-2025 or 1990-2000
    return /^(?:19|20)\d{2}[-\s](?:19|20)\d{2}$/.test(text.trim());
  }

  private static isValid(normalized: string): boolean {
    const digits = normalized.replace(/\+/g, '');
    // 7–15 digits total as per E.164
    return digits.length >= 7 && digits.length <= 15;
  }

  private static normalize(text: string): string | null {
    try {
      // Remove all non-digit characters except +
      let normalized = text.replace(/[^\d+]/g, '');
      
      // If it starts with +, keep it. Otherwise, it's a local number.
      // We don't automatically add + unless we are sure of the country, 
      // but E.164 prefers the + prefix.
      
      // Basic check: if it's 10 digits and doesn't have +, it's likely a local number
      // that could be prefixed if context was known. For now, we just return the digits.
      
      return normalized;
    } catch (err) {
      return null;
    }
  }
}
