import { forwardRef, Module } from '@nestjs/common';
import { ExecutionsModule } from '@/modules/executions.module';
import { FFmpegService } from '@/services/ffmpeg.service';

@Module({
  imports: [forwardRef(() => ExecutionsModule)],
  providers: [FFmpegService],
  exports: [FFmpegService],
})
export class FFmpegModule {}
