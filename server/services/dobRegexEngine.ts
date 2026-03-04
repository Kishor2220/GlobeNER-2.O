import { logger } from "../logger";
import { DateRegexEngine } from "./dateRegexEngine";

export interface DobMatch {
  text: string;
  label: "DATE_OF_BIRTH";
  value: string; // ISO YYYY-MM-DD
  confidence: number;
  start: number;
  end: number;
  method: "regex";
}

export class DobRegexEngine {
  private static readonly TRIGGER_PHRASES = "DOB|Date of Birth|Born on|Birthdate";

  /**
   * Main extraction method for DATE_OF_BIRTH entities
   */
  static extract(text: string): DobMatch[] {
    const results: DobMatch[] = [];
    try {
      // Pattern: Trigger Phrase + Optional Separator + Date Pattern
      // We leverage DateRegexEngine's logic for the actual date part if needed, 
      // but here we define a combined regex for simplicity in matching the trigger.
      
      const pattern = new RegExp(`(?:${this.TRIGGER_PHRASES})[:\\s]+([^\\n,.]+?)(?=[\\s,.]|$)`, 'gi');
      
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const datePart = match[1];
        
        // Use DateRegexEngine to validate and normalize the date part
        const dateMatches = DateRegexEngine.extract(datePart);
        
        if (dateMatches.length > 0) {
          const bestDate = dateMatches[0];
          
          results.push({
            text: fullMatch,
            label: "DATE_OF_BIRTH",
            value: bestDate.value,
            confidence: 0.99,
            start: match.index,
            end: match.index + fullMatch.length,
            method: "regex"
          });
        }
      }
    } catch (err) {
      logger.error("DOB extraction failed", "DobRegexEngine", err);
    }
    return results;
  }
}
