import { logger } from "../logger";

export interface Entity {
  text: string;
  label: string;
  confidence: number;
  start: number;
  end: number;
  source: "regex" | "model";
  [key: string]: any;
}

export class OverlapResolutionService {
  private static readonly REGEX_PRIORITY: Record<string, number> = {
    "EMAIL": 5,
    "PHONE": 4,
    "MONEY": 3,
    "DATE_OF_BIRTH": 2.5, // High priority for DOB
    "DATE": 2,
    "TIME": 1
  };

  /**
   * Resolves overlaps between entities from different sources (Regex and AI Model)
   */
  static resolve(entities: Entity[]): Entity[] {
    if (entities.length === 0) return [];

    // 1. Sort entities:
    // - Primary: Start index (ascending)
    // - Secondary: Length (descending) - prefer longer matches
    // - Tertiary: Source (prefer regex for structured data)
    // - Quaternary: Priority (EMAIL > PHONE > MONEY > DATE > TIME)
    // - Quinary: Confidence
    const sorted = [...entities].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      
      const lenA = a.end - a.start;
      const lenB = b.end - b.start;
      if (lenA !== lenB) return lenB - lenA;

      // Prefer Regex over Model for same span
      if (a.source !== b.source) return a.source === "regex" ? -1 : 1;

      // Priority for Regex types
      const prioA = this.REGEX_PRIORITY[a.label] || 0;
      const prioB = this.REGEX_PRIORITY[b.label] || 0;
      if (prioA !== prioB) return prioB - prioA;

      return b.confidence - a.confidence;
    });

    const finalEntities: Entity[] = [];
    let lastEnd = -1;

    for (const current of sorted) {
      // Rule 1: Remove overlapping entities
      // We use a greedy approach on the sorted list
      if (current.start >= lastEnd) {
        finalEntities.push(current);
        lastEnd = current.end;
      } else {
        // Conflict detected
        const conflictWith = finalEntities.find(e => 
          (current.start < e.end && current.end > e.start)
        );

        if (conflictWith) {
          // Rule 6: Log removed conflicts
          logger.debug(
            `Conflict resolved: Kept [${conflictWith.label}] "${conflictWith.text}" (${conflictWith.source}), ` +
            `Removed [${current.label}] "${current.text}" (${current.source})`,
            "OverlapResolutionService"
          );
        }
      }
    }

    // Rule 5: No duplicate text allowed (for same span/label)
    // This is mostly handled by the overlap logic, but we can do a final pass
    const uniqueResults = finalEntities.filter((entity, index, self) =>
      index === self.findIndex((t) => (
        t.start === entity.start && t.end === entity.end && t.label === entity.label
      ))
    );

    return uniqueResults;
  }
}
