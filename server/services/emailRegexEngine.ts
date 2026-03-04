import { logger } from "../logger";

export interface EmailMatch {
  text: string;
  label: "EMAIL";
  value: string;
  confidence: number;
  start: number;
  end: number;
  method: "regex";
}

export class EmailRegexEngine {
  /**
   * Main extraction method for EMAIL entities
   */
  static extract(text: string): EmailMatch[] {
    const results: EmailMatch[] = [];
    try {
      const patterns = this.getPatterns();
      patterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null) {
          const matchedText = match[0];
          
          // Validation: No trailing punctuation
          const cleanText = matchedText.replace(/[.,!?;:]+$/, '');
          const offset = matchedText.length - cleanText.length;
          
          if (this.isValid(cleanText)) {
            results.push({
              text: cleanText,
              label: "EMAIL",
              value: cleanText.toLowerCase(),
              confidence: 0.98,
              start: match.index,
              end: match.index + cleanText.length,
              method: "regex"
            });
          }
        }
      });
    } catch (err) {
      logger.error("Email extraction failed", "EmailRegexEngine", err);
    }
    return results;
  }

  private static getPatterns(): RegExp[] {
    // Basic pattern to find potential emails, validation happens in isValid
    // We look for something@something.something
    // Local part can contain letters, numbers, dots, plus, underscores, hyphens
    // Domain part can contain letters, numbers, dots, hyphens
    return [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g];
  }

  private static isValid(email: string): boolean {
    // 1. Must contain @
    if (!email.includes('@')) return false;

    const [local, domain] = email.split('@');

    // 2. Local part must not be empty
    if (!local) return false;

    // 3. Domain part must not be empty
    if (!domain) return false;

    // 4. Domain must contain dot
    if (!domain.includes('.')) return false;

    // 5. No spaces (regex already handles this mostly, but good to be sure)
    if (/\s/.test(email)) return false;

    // 6. Domain must have at least one dot and the part after the last dot must be at least 2 chars
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) return false;

    // 7. Reject specific cases like abc@com (where domain is just a TLD)
    if (domainParts.length < 2) return false;

    return true;
  }
}
