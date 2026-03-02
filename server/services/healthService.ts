/**
 * Health Monitoring Service for GlobeNER 2.0
 */
import { logger } from '../logger';
import { db } from '../db';

export enum ServiceStatus {
  OK = 'OK',
  DEGRADED = 'DEGRADED',
  FAIL = 'FAIL',
  LOADING = 'LOADING'
}

class HealthService {
  private statuses: Record<string, ServiceStatus> = {
    database: ServiceStatus.OK,
    model: ServiceStatus.LOADING,
    analytics: ServiceStatus.OK,
    memory: ServiceStatus.OK
  };

  updateStatus(service: string, status: ServiceStatus) {
    if (this.statuses[service] !== status) {
      logger.info(`Service ${service} status changed to ${status}`, 'HealthService');
      this.statuses[service] = status;
    }
  }

  getHealth() {
    // Check database health
    try {
      db.prepare('SELECT 1').get();
      this.updateStatus('database', ServiceStatus.OK);
    } catch (err) {
      this.updateStatus('database', ServiceStatus.FAIL);
    }

    return {
      status: Object.values(this.statuses).every(s => s === ServiceStatus.OK) ? 'healthy' : 'degraded',
      services: this.statuses,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage()
    };
  }
}

export const healthService = new HealthService();
