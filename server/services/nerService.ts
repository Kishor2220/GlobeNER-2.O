export class NERService {
  private static API_URL = "https://router.huggingface.co/hf-inference/models/Davlan/xlm-roberta-base-ner-hrl";

  static async extract(text: string, confidenceThreshold: number = 0.5): Promise<any[]> {
    const token = process.env.HF_TOKEN;
    if (!token) throw new Error("HF_TOKEN missing");

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { aggregation_strategy: "simple" },
          options: { wait_for_model: true }
        }),
      });

      if (!response.ok) {
        throw new Error(`HF API error: ${response.status}`);
      }

      const hfEntities = await response.json();
      
      let entities = hfEntities.map((e: any) => ({
        text: e.word || e.entity || "",
        type: e.entity_group || e.entity || "UNKNOWN",
        confidence: e.score || 0,
        startIndex: e.start || 0,
        endIndex: e.end || 0
      }));

      const ruleEntities = this.extractRules(text);
      entities = [...entities, ...ruleEntities];

      return entities.filter((e: any) => e.confidence >= confidenceThreshold);
    } catch (err: any) {
      console.error("[NERService] Extraction failed:", err.message);
      throw err;
    }
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
          type: rule.type,
          confidence: 1.0,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });
    return results;
  }
}
