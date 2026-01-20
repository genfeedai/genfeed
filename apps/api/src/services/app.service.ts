import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import type { Connection } from 'mongoose';
import type {
  ComponentHealth,
  HealthCheckResponse,
  HealthStatus,
  LivenessResponse,
  MetricsResponse,
  ReadinessResponse,
} from '@/interfaces/health.interface';
import { QUEUE_NAMES } from '@/queue/queue.constants';

// Track process start time for uptime calculations
const startTime = Date.now();

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly version: string;
  private queues: Map<string, Queue> = new Map();

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly configService: ConfigService
  ) {
    this.version = process.env.npm_package_version ?? '1.0.0';
    this.initQueues();
  }

  private initQueues(): void {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    const connection = { host: redisHost, port: redisPort };

    // Initialize queue instances for metrics
    const queueNames = [
      QUEUE_NAMES.WORKFLOW_ORCHESTRATOR,
      QUEUE_NAMES.IMAGE_GENERATION,
      QUEUE_NAMES.VIDEO_GENERATION,
      QUEUE_NAMES.LLM_GENERATION,
      QUEUE_NAMES.PROCESSING,
    ];

    for (const name of queueNames) {
      this.queues.set(name, new Queue(name, { connection }));
    }
  }

  getHello(): string {
    return 'Genfeed Core API';
  }

  private getUptime(): number {
    return Math.floor((Date.now() - startTime) / 1000);
  }

  /**
   * Liveness check - is the process running?
   */
  getLiveness(): LivenessResponse {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
    };
  }

  /**
   * Readiness check - can we accept traffic?
   */
  async getReadiness(): Promise<ReadinessResponse> {
    const dbHealthy = await this.checkDatabase();
    const redisHealthy = await this.checkRedis();

    return {
      ready: dbHealthy && redisHealthy,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy,
        redis: redisHealthy,
      },
    };
  }

  /**
   * Detailed health check with component latency
   */
  async getDetailedHealth(): Promise<HealthCheckResponse> {
    const [dbHealth, redisHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
    ]);

    // Determine overall status
    let status: HealthStatus = 'healthy';
    if (dbHealth.status === 'unhealthy' || redisHealth.status === 'unhealthy') {
      status = 'unhealthy';
    } else if (dbHealth.status === 'degraded' || redisHealth.status === 'degraded') {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      version: this.version,
      components: {
        database: dbHealth,
        redis: redisHealth,
      },
    };
  }

  /**
   * Get system and application metrics
   */
  async getMetrics(): Promise<MetricsResponse> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Get queue metrics
    const queueMetrics: MetricsResponse['queues'] = {};

    for (const [name, queue] of this.queues.entries()) {
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
        ]);
        queueMetrics[name] = { waiting, active, completed, failed };
      } catch {
        queueMetrics[name] = { waiting: 0, active: 0, completed: 0, failed: 0 };
      }
    }

    // Get workflow/execution counts from database
    let workflowTotal = 0;
    let executionTotal = 0;
    let executionRunning = 0;
    let executionCompleted = 0;
    let executionFailed = 0;

    try {
      const db = this.mongoConnection.db;
      if (db) {
        workflowTotal = await db.collection('workflows').countDocuments({ isDeleted: false });
        executionTotal = await db.collection('executions').countDocuments();
        executionRunning = await db.collection('executions').countDocuments({ status: 'running' });
        executionCompleted = await db
          .collection('executions')
          .countDocuments({ status: 'completed' });
        executionFailed = await db.collection('executions').countDocuments({ status: 'failed' });
      }
    } catch (error) {
      this.logger.warn('Failed to get database metrics', error);
    }

    return {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      workflows: {
        total: workflowTotal,
        active: 0, // Would need execution tracking
      },
      executions: {
        total: executionTotal,
        running: executionRunning,
        completed: executionCompleted,
        failed: executionFailed,
      },
      queues: queueMetrics,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // Check if MongoDB connection is ready
      return this.mongoConnection.readyState === 1;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      // Try to ping Redis through one of the queues
      const queue = this.queues.get(QUEUE_NAMES.WORKFLOW_ORCHESTRATOR);
      if (!queue) return false;

      await queue.getWaitingCount();
      return true;
    } catch {
      return false;
    }
  }

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const isConnected = this.mongoConnection.readyState === 1;
      const latency = Date.now() - start;

      if (!isConnected) {
        return {
          status: 'unhealthy',
          latency,
          message: 'MongoDB connection not ready',
          lastCheck: new Date().toISOString(),
        };
      }

      // Ping the database
      const db = this.mongoConnection.db;
      if (db) {
        await db.command({ ping: 1 });
      }

      const pingLatency = Date.now() - start;

      return {
        status: pingLatency > 1000 ? 'degraded' : 'healthy',
        latency: pingLatency,
        message: pingLatency > 1000 ? 'High latency detected' : undefined,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkRedisHealth(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const queue = this.queues.get(QUEUE_NAMES.WORKFLOW_ORCHESTRATOR);
      if (!queue) {
        return {
          status: 'unhealthy',
          latency: Date.now() - start,
          message: 'Queue not initialized',
          lastCheck: new Date().toISOString(),
        };
      }

      await queue.getWaitingCount();
      const latency = Date.now() - start;

      return {
        status: latency > 500 ? 'degraded' : 'healthy',
        latency,
        message: latency > 500 ? 'High latency detected' : undefined,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }
}
