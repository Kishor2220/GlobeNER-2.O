import { db } from "../db";

export enum AlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface Alert {
  id?: number;
  alert_type: string;
  related_entities: string; // JSON string of entity names
  timestamp?: string;
  severity: AlertSeverity;
  explanation: string;
}

export class AlertService {
  static createAlert(alert: Alert) {
    db.prepare(`
      INSERT INTO intelligence_alerts (alert_type, related_entities, severity, explanation)
      VALUES (?, ?, ?, ?)
    `).run(alert.alert_type, alert.related_entities, alert.severity, alert.explanation);
  }

  static getRecentAlerts(limit: number = 20, severity?: string) {
    let query = "SELECT * FROM intelligence_alerts";
    const params: any[] = [];

    if (severity && severity !== "ALL") {
      query += " WHERE severity = ?";
      params.push(severity);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    return db.prepare(query).all(...params);
  }

  static generateNewEntityAlert(entityName: string, entityType: string) {
    this.createAlert({
      alert_type: "NEW_ENTITY_DETECTED",
      related_entities: JSON.stringify([entityName]),
      severity: AlertSeverity.LOW,
      explanation: `New entity '${entityName}' of type '${entityType}' has been detected in the intelligence network.`,
    });
  }

  static generateFrequencySpikeAlert(entityName: string, count: number) {
    this.createAlert({
      alert_type: "HIGH_FREQUENCY_SPIKE",
      related_entities: JSON.stringify([entityName]),
      severity: AlertSeverity.MEDIUM,
      explanation: `Entity '${entityName}' is showing an unusual frequency spike with ${count} occurrences in a single session.`,
    });
  }

  static generateSuddenRelationshipAlert(entityA: string, entityB: string) {
    this.createAlert({
      alert_type: "SUDDEN_RELATIONSHIP_FORMATION",
      related_entities: JSON.stringify([entityA, entityB]),
      severity: AlertSeverity.MEDIUM,
      explanation: `A new relationship has been formed between '${entityA}' and '${entityB}'.`,
    });
  }

  static generateLowTrustAlert(entityName: string, confidence: number) {
    this.createAlert({
      alert_type: "LOW_TRUST_SCORE",
      related_entities: JSON.stringify([entityName]),
      severity: AlertSeverity.HIGH,
      explanation: `Entity '${entityName}' has been detected with a critically low trust score (confidence: ${confidence.toFixed(2)}).`,
    });
  }

  static generateRelationshipDisappearanceAlert(entityA: string, entityB: string) {
    this.createAlert({
      alert_type: "RELATIONSHIP_DISAPPEARANCE",
      related_entities: JSON.stringify([entityA, entityB]),
      severity: AlertSeverity.MEDIUM,
      explanation: `The relationship between '${entityA}' and '${entityB}' has faded from active intelligence.`,
    });
  }
}
