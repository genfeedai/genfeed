import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ExecutionsModule } from '../executions/executions.module';
import { ExecutionsService } from '../executions/executions.service';
import { FFmpegModule } from '../ffmpeg/ffmpeg.module';
import { FFmpegService } from '../ffmpeg/ffmpeg.service';
import { ReplicateModule } from '../replicate/replicate.module';
import { ReplicateService } from '../replicate/replicate.service';
import { TTSModule } from '../tts/tts.module';
import { TTSService } from '../tts/tts.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { WorkflowsService } from '../workflows/workflows.service';
import { BullBoardController } from './dashboard/bull-board.controller';
import { ImageProcessor } from './processors/image.processor';
import { LLMProcessor } from './processors/llm.processor';
import { ProcessingProcessor } from './processors/processing.processor';
import { VideoProcessor } from './processors/video.processor';
import { WorkflowProcessor } from './processors/workflow.processor';
import { DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from './queue.constants';
import { QueueJob, QueueJobSchema } from './schemas/queue-job.schema';
import { JobRecoveryService } from './services/job-recovery.service';
import { QueueManagerService } from './services/queue-manager.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),

    // BullMQ Redis connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        return {
          connection: {
            host: redisHost,
            port: redisPort,
            ...(redisPassword && { password: redisPassword }),
          },
        };
      },
      inject: [ConfigService],
    }),

    // Register queues
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.WORKFLOW_ORCHESTRATOR,
        defaultJobOptions: DEFAULT_JOB_OPTIONS[QUEUE_NAMES.WORKFLOW_ORCHESTRATOR],
      },
      {
        name: QUEUE_NAMES.IMAGE_GENERATION,
        defaultJobOptions: DEFAULT_JOB_OPTIONS[QUEUE_NAMES.IMAGE_GENERATION],
      },
      {
        name: QUEUE_NAMES.VIDEO_GENERATION,
        defaultJobOptions: DEFAULT_JOB_OPTIONS[QUEUE_NAMES.VIDEO_GENERATION],
      },
      {
        name: QUEUE_NAMES.LLM_GENERATION,
        defaultJobOptions: DEFAULT_JOB_OPTIONS[QUEUE_NAMES.LLM_GENERATION],
      },
      {
        name: QUEUE_NAMES.PROCESSING,
        defaultJobOptions: DEFAULT_JOB_OPTIONS[QUEUE_NAMES.PROCESSING],
      }
    ),

    // MongoDB schema for job persistence
    MongooseModule.forFeature([{ name: QueueJob.name, schema: QueueJobSchema }]),

    // Feature modules
    forwardRef(() => ExecutionsModule),
    forwardRef(() => WorkflowsModule),
    forwardRef(() => ReplicateModule),
    forwardRef(() => TTSModule),
    forwardRef(() => FFmpegModule),
  ],
  providers: [
    // Services
    QueueManagerService,
    JobRecoveryService,

    // Processors
    WorkflowProcessor,
    ImageProcessor,
    VideoProcessor,
    LLMProcessor,
    ProcessingProcessor,

    // Aliased providers for forwardRef injection in processors
    {
      provide: 'QueueManagerService',
      useExisting: QueueManagerService,
    },
    {
      provide: 'ExecutionsService',
      useExisting: ExecutionsService,
    },
    {
      provide: 'WorkflowsService',
      useExisting: WorkflowsService,
    },
    {
      provide: 'ReplicateService',
      useExisting: ReplicateService,
    },
    {
      provide: 'TTSService',
      useExisting: TTSService,
    },
    {
      provide: 'FFmpegService',
      useExisting: FFmpegService,
    },
  ],
  controllers: [BullBoardController],
  exports: [QueueManagerService, JobRecoveryService, BullModule],
})
export class QueueModule {}
