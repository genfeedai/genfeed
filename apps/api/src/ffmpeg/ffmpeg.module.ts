import { forwardRef, Module } from '@nestjs/common';
import { ExecutionsModule } from '../executions/executions.module';
import { FFmpegService } from './ffmpeg.service';

@Module({
  imports: [forwardRef(() => ExecutionsModule)],
  providers: [FFmpegService],
  exports: [FFmpegService],
})
export class FFmpegModule {}
