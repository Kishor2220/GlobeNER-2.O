import { AnalyticsService } from "./analyticsService";

export interface ReasoningHint {
  type: "INFLUENCE" | "ANOMALY" | "RELATIONSHIP" | "RISK";
  target: string;
  explanation: string;
  impact: string;
}

export class ReasoningService {
  /**
   * Generates causal reasoning hints for entities and relationships
   */
  static generateHints(nodes: any[], links: any[], anomalies: any[]): ReasoningHint[] {
    const hints: ReasoningHint[] = [];

    // 1. Influence Reasoning
    const topInfluencers = [...nodes].sort((a, b) => b.centrality - a.centrality).slice(0, 2);
    topInfluencers.forEach(node => {
      hints.push({
        type: "INFLUENCE",
        target: node.name,
        explanation: `${node.name} acts as a central hub with ${node.centrality} direct connections across multiple document contexts.`,
        impact: "Changes or events involving this entity will likely propagate through the network rapidly."
      });
    });

    // 2. Anomaly Reasoning
    anomalies.slice(0, 2).forEach(anomaly => {
      hints.push({
        type: "ANOMALY",
        target: anomaly.entity,
        explanation: `Detected as ${anomaly.type} because ${anomaly.reason.toLowerCase()}.`,
        impact: "This may indicate data entry errors, spoofing attempts, or a significant emerging trend."
      });
    });

    // 3. Risk Reasoning (High-risk relationships)
    const highRiskLinks = links.filter(l => l.label === "financial_transaction" || l.label === "contacted").slice(0, 2);
    highRiskLinks.forEach(link => {
      hints.push({
        type: "RISK",
        target: `${link.source} ↔ ${link.target}`,
        explanation: `A ${link.label} relationship was inferred between these entities in a sensitive context.`,
        impact: "Requires manual verification to ensure compliance and security protocols are met."
      });
    });

    return hints;
  }

  /**
   * Simple Natural Language Query Parser
   * Maps plain text queries to graph filters or search actions
   */
  static parseQuery(query: string, nodes: any[]): any {
    const q = query.toLowerCase();
    
    // 1. "Show organizations related to X"
    const orgMatch = q.match(/organizations related to (.+)/i);
    if (orgMatch) {
      const target = orgMatch[1].trim();
      return { action: "FILTER_RELATED", type: "ORG", target };
    }

    // 2. "Who contacted X"
    const contactMatch = q.match(/who contacted (.+)/i);
    if (contactMatch) {
      const target = contactMatch[1].trim();
      return { action: "FIND_PATH", type: "PER", target, relationship: "contacted" };
    }

    // 3. "Top entities"
    if (q.includes("top entities") || q.includes("most influential")) {
      return { action: "SORT_INFLUENCE", limit: 5 };
    }

    // 4. "Suspicious patterns"
    if (q.includes("suspicious") || q.includes("anomalies")) {
      return { action: "SHOW_ANOMALIES" };
    }

    // Default: Search by name
    return { action: "SEARCH", query: q };
  }
}
