/**
 * Health check response interfaces for production deployments
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  status: HealthStatus;
  latency?: number; // ms
  message?: string;
  lastCheck?: string;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number; // seconds
  version: string;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    ollama?: ComponentHealth;
  };
}

export interface ReadinessResponse {
  ready: boolean;
  timestamp: string;
  checks: {
    database: boolean;
    redis: boolean;
  };
}

export interface LivenessResponse {
  alive: boolean;
  timestamp: string;
  uptime: number;
}

export interface MetricsResponse {
  timestamp: string;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  workflows: {
    total: number;
    active: number;
  };
  executions: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  queues: {
    [queueName: string]: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  };
}
