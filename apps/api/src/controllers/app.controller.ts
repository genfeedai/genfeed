import { Controller, Get } from '@nestjs/common';
import type {
  HealthCheckResponse,
  LivenessResponse,
  MetricsResponse,
  ReadinessResponse,
} from '@/interfaces/health.interface';
import { AppService } from '@/services/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Basic health check (legacy, kept for compatibility)
   */
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Kubernetes liveness probe - is the process running?
   * Returns 200 if alive, used to restart unhealthy pods
   */
  @Get('health/live')
  async liveness(): Promise<LivenessResponse> {
    return this.appService.getLiveness();
  }

  /**
   * Kubernetes readiness probe - can we accept traffic?
   * Returns 200 only if all dependencies are available
   */
  @Get('health/ready')
  async readiness(): Promise<ReadinessResponse> {
    return this.appService.getReadiness();
  }

  /**
   * Detailed health check with component status
   * For monitoring dashboards and debugging
   */
  @Get('health/detailed')
  async detailedHealth(): Promise<HealthCheckResponse> {
    return this.appService.getDetailedHealth();
  }

  /**
   * Prometheus-compatible metrics endpoint
   * Returns system and application metrics
   */
  @Get('metrics')
  async metrics(): Promise<MetricsResponse> {
    return this.appService.getMetrics();
  }
}
