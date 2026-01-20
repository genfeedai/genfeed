import { Module } from '@nestjs/common';
import { OllamaService } from '@/services/ollama.service';

@Module({
  providers: [OllamaService],
  exports: [OllamaService],
})
export class OllamaModule {}
