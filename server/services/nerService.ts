import { ModelService } from "./modelService";
import { RegexService } from "./regexService";

export class NERService {
  /**
   * Main extraction pipeline with hybrid logic and post-processing
   */
  static async extract(text: string, confidenceThreshold: number = 0.5): Promise<any[]> {
    if (!text || !text.trim()) return [];

    // 0. Normalize Unicode Text
    const normalizedText = text.normalize('NFC');

    try {
      // 1. Run Local Model Inference
      const classifier = await ModelService.getInstance();
      const modelOutput = await classifier(normalizedText, {
        aggregation_strategy: 'simple',
        ignore_labels: ['O']
      });

      // Log raw model output for debugging
      console.log("[NERService] Raw Model Output:", JSON.stringify(modelOutput, null, 2));

      // 2. Map & Aggregate Model Entities
      let modelEntities = this.aggregateEntities(modelOutput, normalizedText);
      
      // Normalize Model Labels
      modelEntities = modelEntities.map(e => ({
        ...e,
        label: this.normalizeLabel(e.label),
        source: 'model'
      }));

      // 3. Run Regex Extraction (Rule-based)
      const regexEntities = RegexService.extract(normalizedText).map(e => ({
        ...e,
        source: 'regex'
      }));
      
      console.log("[NERService] Regex Matches:", JSON.stringify(regexEntities, null, 2));

      // 4. Merge & Resolve Overlaps
      // Priority: Regex (Structured) > Model (Contextual)
      let allEntities = [...modelEntities, ...regexEntities];
      
      // Filter by confidence (Model only, Regex is always 1.0)
      allEntities = allEntities.filter(e => e.source === 'regex' || e.confidence >= confidenceThreshold);

      // Resolve Overlaps
      let finalEntities = this.resolveOverlaps(allEntities);

      // 5. Final Validation & Normalization
      finalEntities = finalEntities.filter(e => this.validateEntity(e));

      console.log("[NERService] Final Filtered Entities:", JSON.stringify(finalEntities, null, 2));

      return finalEntities;

    } catch (err: any) {
      console.error("[NERService] Extraction failed:", err.message);
      // Fallback to regex only if model fails
      return RegexService.extract(normalizedText).filter(e => this.validateEntity(e));
    }
  }

  /**
   * Normalizes labels to standard set
   */
  private static normalizeLabel(label: string): string {
    const map: Record<string, string> = {
      'PER': 'PER', 'PERSON': 'PER',
      'ORG': 'ORG', 'ORGANIZATION': 'ORG',
      'LOC': 'LOC', 'LOCATION': 'LOC', 'GPE': 'LOC',
      'DATE': 'DATE',
      'TIME': 'TIME',
      'EMAIL': 'EMAIL',
      'PHONE': 'PHONE',
      'MONEY': 'MONEY',
      'MISC': 'MISC'
    };
    return map[label.toUpperCase()] || label.toUpperCase();
  }

  /**
   * Strict validation rules for entities
   */
  private static validateEntity(entity: any): boolean {
    const text = entity.text.trim();
    if (!text) return false;

    switch (entity.label) {
      case 'TIME':
        // Must contain at least one digit and a separator or AM/PM
        return /[\d\u0966-\u096F\u0CE6-\u0CEF]/.test(text) && /[:\s]/.test(text);
      case 'DATE':
        // Must contain digits
        return /[\d\u0966-\u096F\u0CE6-\u0CEF]/.test(text);
      case 'PHONE':
        // Must have at least 7 digits
        const digits = text.replace(/\D/g, '');
        return digits.length >= 7;
      case 'MONEY':
        // Must contain currency symbol or code
        return /[₹$€£¥]|USD|INR|EUR/.test(text);
      case 'EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      default:
        // Model entities (PER, LOC, ORG) should be at least 2 chars
        return text.length >= 2;
    }
  }

  /**
   * Advanced overlap resolution
   */
  private static resolveOverlaps(entities: any[]): any[] {
    if (entities.length === 0) return [];

    // Sort: 1. Start index (asc), 2. Length (desc), 3. Priority (Regex > Model)
    const sorted = entities.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      const lenA = a.end - a.start;
      const lenB = b.end - b.start;
      if (lenA !== lenB) return lenB - lenA;
      if (a.source !== b.source) return a.source === 'regex' ? -1 : 1;
      return b.confidence - a.confidence;
    });

    const result: any[] = [];
    let lastEnd = -1;

    for (const entity of sorted) {
      if (entity.start >= lastEnd) {
        result.push(entity);
        lastEnd = entity.end;
      } else {
        // Overlap detected. 
        // If current is regex and previous was model, and they overlap significantly, 
        // we might want to prefer regex. But our sort already handles priority if they start at same place.
        // If they overlap but current starts later, we skip current because we prefer the earlier/longer one.
      }
    }

    return result;
  }

  private static aggregateEntities(rawEntities: any[], text: string) {
    if (!rawEntities || rawEntities.length === 0) return [];

    const aggregated: any[] = [];
    let currentEntity: any = null;

    for (const token of rawEntities) {
      const entityType = token.entity.replace(/^[BI]-/, '');
      const isStart = token.entity.startsWith('B-');
      
      if (currentEntity && (isStart || currentEntity.label !== entityType)) {
        // Push previous entity
        aggregated.push(currentEntity);
        currentEntity = null;
      }

      if (isStart || !currentEntity) {
        // Start new entity
        currentEntity = {
          text: token.word,
          label: entityType,
          confidence: token.score,
          start: null,
          end: null,
          tokens: [token]
        };
      } else if (currentEntity && currentEntity.label === entityType) {
        // Append to current entity
        // Handle subwords (##) if applicable, though BERT multilingual usually doesn't use ## for whole words?
        // Actually BERT uses ##.
        if (token.word.startsWith('##')) {
          currentEntity.text += token.word.substring(2);
        } else {
          // Check if we should add space?
          // It's hard to know without offsets.
          // We'll reconstruct text later or just join with space for now, 
          // but better to use the original text to find the span.
          currentEntity.text += " " + token.word;
        }
        // Average confidence? Or max? Or min?
        // Let's take min for strictness, or average.
        currentEntity.confidence = (currentEntity.confidence * currentEntity.tokens.length + token.score) / (currentEntity.tokens.length + 1);
        currentEntity.tokens.push(token);
      }
    }
    if (currentEntity) {
      aggregated.push(currentEntity);
    }

    // Now find offsets in original text
    let lastIndex = 0;
    return aggregated.map(entity => {
      // Clean up text (remove spaces around punctuation if needed, but our reconstruction is rough)
      // Better strategy: Find the sequence of tokens in the text.
      // But tokens might be modified (e.g. ##).
      // Let's search for the first token's word, then extend to the last token's word.
      
      // Simple approach: Search for the reconstructed text (ignoring punctuation spacing issues)
      // This is fragile.
      
      // Robust approach: Search for the first token, then ensure subsequent tokens follow.
      // But we don't have offsets for tokens.
      
      // Let's try to find the "text" we built.
      // If it fails, we might need a fuzzy search or just accept the rough text.
      
      // Fix for punctuation: "Inc ." -> "Inc."
      // We can try to find the exact substring in text that matches the sequence of tokens.
      
      // For now, let's just search for the text starting from lastIndex.
      // We might need to normalize spaces.
      
      // Heuristic: Remove spaces before punctuation in our constructed text?
      // Or just search for the tokens individually?
      
      // Let's try to find the span that covers all tokens.
      let start = -1;
      let end = -1;
      
      // Find start of first token
      const firstToken = entity.tokens[0].word.replace(/^##/, '');
      const startIdx = text.indexOf(firstToken, lastIndex);
      
      if (startIdx !== -1) {
        start = startIdx;
        // Find end of last token
        const lastToken = entity.tokens[entity.tokens.length - 1].word.replace(/^##/, '');
        // Search for last token after start
        // Be careful with "New York" -> "New" and "York".
        // We need to find "York" after "New".
        
        let currentSearchIdx = start + firstToken.length;
        for (let i = 1; i < entity.tokens.length; i++) {
          const tokenText = entity.tokens[i].word.replace(/^##/, '');
          const tokenIdx = text.indexOf(tokenText, currentSearchIdx);
          if (tokenIdx !== -1) {
            currentSearchIdx = tokenIdx + tokenText.length;
          }
        }
        end = currentSearchIdx;
        
        // Update entity text to match exactly what's in the source
        entity.text = text.substring(start, end);
        entity.start = start;
        entity.end = end;
        lastIndex = end;
      }
      
      delete entity.tokens;
      return entity;
    });
  }
}
