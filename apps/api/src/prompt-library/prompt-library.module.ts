import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromptLibraryController } from './prompt-library.controller';
import { PromptLibraryService } from './prompt-library.service';
import { PromptLibraryItem, PromptLibraryItemSchema } from './schemas/prompt-library-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PromptLibraryItem.name, schema: PromptLibraryItemSchema }]),
  ],
  controllers: [PromptLibraryController],
  providers: [PromptLibraryService],
  exports: [PromptLibraryService],
})
export class PromptLibraryModule {}
