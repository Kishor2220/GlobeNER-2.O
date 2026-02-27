import { ModelService } from "./modelService";

export class NERService {
  static async extract(text: string, confidenceThreshold: number = 0.5): Promise<any[]> {
    if (!text || !text.trim()) return [];

    try {
      // 1. Run Local Model Inference
      const classifier = await ModelService.getInstance();
      const output = await classifier(text, {
        aggregation_strategy: 'simple', // Merge subwords
        ignore_labels: ['O']
      });

      // 2. Map Output to Standard Format
      // Manual aggregation since 'simple' strategy didn't work for this model
      let entities = this.aggregateEntities(output, text);

      // 3. Run Regex Extraction (Rule-based)
      const ruleEntities = this.extractRules(text);
      entities = [...entities, ...ruleEntities];

      // 4. Filter by Confidence
      return entities.filter((e: any) => e.confidence >= confidenceThreshold);

    } catch (err: any) {
      console.error("[NERService] Extraction failed:", err.message);
      // Fallback to regex only if model fails
      return this.extractRules(text);
    }
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

  private static extractRules(text: string) {
    const rules = [
      { type: "EMAIL", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
      { type: "PHONE", regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
      { type: "MONEY", regex: /([₹$€£¥]|USD|INR|EUR)\s?\d+([,.]\d+)?/g },
      { type: "DATE", regex: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g }
    ];

    const results: any[] = [];
    rules.forEach(rule => {
      let match;
      while ((match = rule.regex.exec(text)) !== null) {
        results.push({
          text: match[0],
          label: rule.type, // Map 'type' to 'label' for consistency
          confidence: 1.0,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    return results;
  }
}
