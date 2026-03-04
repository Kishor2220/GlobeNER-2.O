import { ModelService } from "./modelService";
import { RegexService } from "./regexService";
import { OverlapResolutionService } from "./overlapResolutionService";
import { logger } from "../logger";
import { CONFIG } from "../config";

export class NERService {
  /**
   * Main extraction pipeline with hybrid logic and post-processing
   */
  static async extract(text: string, confidenceThreshold: number = 0.5): Promise<any[]> {
    if (!text || !text.trim()) return [];

    // 0. Normalize Unicode Text (NFKC) and clean
    const normalizedText = RegexService.normalizeText(text);

    try {
      // 1. Run Regex Extraction (Rule-based) independently
      const regexPromise = new Promise<any[]>((resolve) => {
        // Use setImmediate to avoid blocking the event loop immediately
        setImmediate(() => {
          try {
            const entities = RegexService.extract(normalizedText).map(e => ({
              ...e,
              source: 'regex'
            }));
            resolve(entities);
          } catch (err) {
            logger.error("Regex extraction failed", "NERService", err);
            resolve([]);
          }
        });
      });

      // 2. Run Local Model Inference with timeout
      const modelPromise = (async () => {
        try {
          const classifier = await ModelService.getInstance();
          const modelOutput = await classifier(normalizedText, {
            aggregation_strategy: 'simple',
            ignore_labels: ['O']
          });

          // Map & Aggregate Model Entities
          let modelEntities = this.aggregateEntities(modelOutput, normalizedText);
          
          // Normalize Model Labels
          return modelEntities.map(e => ({
            ...e,
            label: this.normalizeLabel(e.label),
            source: 'model'
          }));
        } catch (err) {
          logger.error("Model extraction failed", "NERService", err);
          return [];
        }
      })();

      // Inference timeout from config
      const timeoutPromise = new Promise<any[]>((_, reject) => 
        setTimeout(() => reject(new Error("Model inference timeout")), CONFIG.MODEL.INFERENCE_TIMEOUT_MS)
      );

      // Wait for both to complete or timeout
      const [regexEntities, modelEntities] = await Promise.all([
        regexPromise,
        Promise.race([modelPromise, timeoutPromise]).catch(err => {
          logger.warn(`Model timed out or failed: ${err.message}`, "NERService");
          return [];
        })
      ]);

      // 4. Merge & Resolve Overlaps
      let allEntities = [...modelEntities, ...regexEntities];
      
      // Filter by confidence (Model only, Regex is always 1.0)
      allEntities = allEntities.filter(e => e.source === 'regex' || e.confidence >= confidenceThreshold);

      // Resolve Overlaps using dedicated service
      let finalEntities = OverlapResolutionService.resolve(allEntities);

      // 5. Final Validation & Normalization
      finalEntities = finalEntities.filter(e => this.validateEntity(e));

      return finalEntities;

    } catch (err: any) {
      logger.error("Extraction failed critically", "NERService", err);
      // Fallback to regex only if everything fails
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
      'DATE_OF_BIRTH': 'DATE_OF_BIRTH',
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
      case 'DATE_OF_BIRTH':
        // Must contain digits and a trigger phrase (handled by engine, but good to check)
        return /[\d\u0966-\u096F\u0CE6-\u0CEF]/.test(text) && /DOB|Birth|Born/i.test(text);
      case 'PHONE':
        // Must have at least 7 digits
        const digits = text.replace(/\D/g, '');
        return digits.length >= 7;
      case 'MONEY':
        // Support expanded set of symbols and codes from MoneyRegexEngine
        return /[$€£₹¥₩₽฿₫₦₱₪₡₴₲₵]|USD|EUR|GBP|INR|JPY|CNY|AUD|CAD|SGD|AED|SAR|ZAR|CHF|lakh|crore/i.test(text);
      case 'EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      default:
        // Model entities (PER, LOC, ORG) should be at least 2 chars
        return text.length >= 2;
    }
  }

  private static aggregateEntities(rawEntities: any[], text: string) {
    if (!rawEntities || rawEntities.length === 0) return [];

    // If the pipeline already aggregated them (e.g., using aggregation_strategy: 'simple')
    if (rawEntities[0].entity_group) {
      return rawEntities.map(e => ({
        text: e.word.trim(),
        label: e.entity_group,
        confidence: e.score,
        start: e.start !== undefined ? e.start : text.indexOf(e.word.trim()),
        end: e.end !== undefined ? e.end : text.indexOf(e.word.trim()) + e.word.trim().length
      }));
    }

    const aggregated: any[] = [];
    let currentEntity: any = null;

    for (const token of rawEntities) {
      if (!token.entity) continue;
      
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
        if (token.word.startsWith('##')) {
          currentEntity.text += token.word.substring(2);
        } else {
          currentEntity.text += " " + token.word;
        }
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
      let start = -1;
      let end = -1;
      
      const firstToken = entity.tokens[0].word.replace(/^##/, '');
      const startIdx = text.indexOf(firstToken, lastIndex);
      
      if (startIdx !== -1) {
        start = startIdx;
        let currentSearchIdx = start + firstToken.length;
        for (let i = 1; i < entity.tokens.length; i++) {
          const tokenText = entity.tokens[i].word.replace(/^##/, '');
          const tokenIdx = text.indexOf(tokenText, currentSearchIdx);
          if (tokenIdx !== -1) {
            currentSearchIdx = tokenIdx + tokenText.length;
          }
        }
        end = currentSearchIdx;
        
        entity.text = text.substring(start, end);
        entity.start = start;
        entity.end = end;
        lastIndex = end;
      }
      
      delete entity.tokens;
      return entity;
    }).filter(e => e.start !== -1);
  }
}
