export class NerService {
  private static hfToken = process.env.HF_TOKEN;
  private static API_URL = "https://router.huggingface.co/hf-inference/models/ai4bharat/IndicNER";
  private static isModelLoaded = false;

  static async warmUp() {
    if (this.isModelLoaded) return;
    console.log("[NER] Warming up model...");
    try {
      await this.extractEntities("warm-up", 0.5);
      this.isModelLoaded = true;
      console.log("[NER] Model warmed up successfully");
    } catch (err) {
      console.error("[NER] Model warm-up failed:", err);
    }
  }

  static async extractEntities(text: string, confidenceThreshold: number = 0.5, retry = true): Promise<any[]> {
    if (!this.hfToken || this.hfToken === "MY_HF_TOKEN") {
      console.error("[NER] HF_TOKEN is missing or invalid");
      throw new Error("Hugging Face Token not configured. Please set HF_TOKEN in environment variables.");
    }

    console.log(`[NER] Request start. Text length: ${text.length}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const hfResponse = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { aggregation_strategy: "simple" },
          options: { wait_for_model: true }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        console.error(`[NER] HF API error (${hfResponse.status}): ${errorText}`);
        
        if (retry && (hfResponse.status === 503 || hfResponse.status === 429 || hfResponse.status === 500)) {
          console.log("[NER] Retrying request once...");
          return this.extractEntities(text, confidenceThreshold, false);
        }
        
        throw new Error(`HF API error (${hfResponse.status}): ${errorText}`);
      }

      const hfEntities = await hfResponse.json();
      console.log(`[NER] Response received. Entities found: ${hfEntities.length}`);
      
      let entities = hfEntities.map((e: any) => ({
        text: e.word,
        label: e.entity_group,
        confidence: e.score,
        start: e.start,
        end: e.end
      }));

      const ruleEntities = this.extractRules(text);
      entities = [...entities, ...ruleEntities];

      return entities.filter((e: any) => e.confidence >= confidenceThreshold);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error("[NER] Request timed out after 30 seconds");
        throw new Error("Hugging Face API request timed out after 30 seconds.");
      }
      
      if (retry) {
        console.log("[NER] Request failed, retrying once...");
        return this.extractEntities(text, confidenceThreshold, false);
      }
      
      console.error("[NER] Extraction failed:", err.message);
      throw err;
    }
  }

  private static extractRules(text: string) {
    const rules = [
      {
        label: "EMAIL",
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      },
      {
        label: "PHONE",
        regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      },
      {
        label: "MONEY",
        regex: /([₹$€£¥]|USD|INR|EUR)\s?\d+([,.]\d+)?/g,
      },
      {
        label: "DATE",
        regex: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g,
      }
    ];

    const results: any[] = [];
    rules.forEach(rule => {
      let match;
      while ((match = rule.regex.exec(text)) !== null) {
        results.push({
          text: match[0],
          label: rule.label,
          confidence: 1.0,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    return results;
  }

  static async batchExtract(texts: string[], threshold: number = 0.5) {
    const results = [];
    for (const text of texts) {
      try {
        const entities = await this.extractEntities(text, threshold);
        results.push({ text, entities });
      } catch (err) {
        results.push({ text, entities: [], error: (err as Error).message });
      }
    }
    return results;
  }
}
