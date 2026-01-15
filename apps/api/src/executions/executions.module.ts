import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExecutionsController } from './executions.controller';
import { ExecutionsService } from './executions.service';
import { Job, JobSchema } from './schemas/job.schema';

@Module({
  // Job model still needs Mongoose for Replicate prediction tracking
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }])],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
