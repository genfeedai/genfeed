import { Module } from '@nestjs/common';
import { PromptLibraryController } from './prompt-library.controller';
import { PromptLibraryService } from './prompt-library.service';

@Module({
  controllers: [PromptLibraryController],
  providers: [PromptLibraryService],
  exports: [PromptLibraryService],
})
export class PromptLibraryModule {}
