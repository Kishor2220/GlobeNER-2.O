import { NERService } from "./nerService";

export interface EntityLabel {
  text: string;
  label: string;
}

export interface BenchmarkDocument {
  text: string;
  expectedEntities: EntityLabel[];
}

export class EvaluationService {
  static async runBenchmark(dataset: BenchmarkDocument[]) {
    const failures: any[] = [];
    let totalInferenceTime = 0;
    
    // Confusion Matrix: actual -> predicted -> count
    const confusionMatrix: Record<string, Record<string, number>> = {};
    const labels = ["PER", "LOC", "ORG", "DATE", "TIME", "MONEY", "EMAIL", "PHONE", "MISC", "O"];
    labels.forEach(l1 => {
      confusionMatrix[l1] = {};
      labels.forEach(l2 => confusionMatrix[l1][l2] = 0);
    });

    let tp = 0, fp = 0, fn = 0;
    const confidenceBins = {
      "0.0-0.2": { correct: 0, total: 0 },
      "0.2-0.4": { correct: 0, total: 0 },
      "0.4-0.6": { correct: 0, total: 0 },
      "0.6-0.8": { correct: 0, total: 0 },
      "0.8-1.0": { correct: 0, total: 0 },
    };

    const startMemory = process.memoryUsage().heapUsed;

    for (const doc of dataset) {
      const start = Date.now();
      const predicted = await NERService.extract(doc.text, 0.1); // low threshold to evaluate all
      const inferenceTime = Date.now() - start;
      totalInferenceTime += inferenceTime;

      const expected = doc.expectedEntities;
      
      const predMap = new Map(predicted.map(p => [p.text.toLowerCase(), p]));
      const expMap = new Map(expected.map(e => [e.text.toLowerCase(), e]));

      predicted.forEach(p => {
        const textKey = p.text.toLowerCase();
        const exp = expMap.get(textKey);
        
        // Confidence binning
        const conf = p.confidence || 0;
        let bin = "0.0-0.2";
        if (conf > 0.8) bin = "0.8-1.0";
        else if (conf > 0.6) bin = "0.6-0.8";
        else if (conf > 0.4) bin = "0.4-0.6";
        else if (conf > 0.2) bin = "0.2-0.4";
        
        confidenceBins[bin as keyof typeof confidenceBins].total++;

        if (exp) {
          if (exp.label === p.label) {
            tp++;
            if (confusionMatrix[exp.label] && confusionMatrix[exp.label][p.label] !== undefined) {
              confusionMatrix[exp.label][p.label]++;
            }
            confidenceBins[bin as keyof typeof confidenceBins].correct++;
          } else {
            fp++; // Misclassification
            if (confusionMatrix[exp.label] && confusionMatrix[exp.label][p.label] !== undefined) {
              confusionMatrix[exp.label][p.label]++;
            }
            failures.push({ type: "MISCLASSIFICATION", text: p.text, expected: exp.label, predicted: p.label, confidence: p.confidence, context: doc.text });
          }
        } else {
          fp++; // False positive
          if (confusionMatrix["O"] && confusionMatrix["O"][p.label] !== undefined) {
            confusionMatrix["O"][p.label]++;
          }
          failures.push({ type: "FALSE_POSITIVE", text: p.text, predicted: p.label, confidence: p.confidence, context: doc.text });
        }
      });

      expected.forEach(e => {
        const textKey = e.text.toLowerCase();
        if (!predMap.has(textKey)) {
          fn++; // False negative
          if (confusionMatrix[e.label] && confusionMatrix[e.label]["O"] !== undefined) {
            confusionMatrix[e.label]["O"]++;
          }
          failures.push({ type: "FALSE_NEGATIVE", text: e.text, expected: e.label, context: doc.text });
        }
      });
    }

    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsedMB = (endMemory - startMemory) / 1024 / 1024;

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    // Calculate calibration (Expected accuracy vs actual accuracy per bin)
    const calibration = Object.entries(confidenceBins).map(([bin, data]) => ({
      bin,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
      volume: data.total
    }));

    return {
      metrics: {
        precision,
        recall,
        f1,
        totalInferenceTime,
        avgInferenceTime: totalInferenceTime / dataset.length,
        throughput: dataset.length / (totalInferenceTime / 1000),
        memoryUsedMB: Math.max(0, memoryUsedMB)
      },
      calibration,
      confusionMatrix,
      failures: failures.slice(0, 100)
    };
  }
}
