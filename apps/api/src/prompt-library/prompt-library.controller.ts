import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import type { CreatePromptLibraryItemDto } from './dto/create-prompt-library-item.dto';
import type { QueryPromptLibraryDto } from './dto/query-prompt-library.dto';
import type { PromptLibraryService } from './prompt-library.service';

@Controller('prompt-library')
export class PromptLibraryController {
  constructor(private readonly promptLibraryService: PromptLibraryService) {}

  @Post()
  create(@Body() createDto: CreatePromptLibraryItemDto) {
    return this.promptLibraryService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QueryPromptLibraryDto) {
    return this.promptLibraryService.findAll(query);
  }

  @Get('featured')
  findFeatured(@Query('limit') limit?: number) {
    return this.promptLibraryService.findFeatured(limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promptLibraryService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: Partial<CreatePromptLibraryItemDto>) {
    return this.promptLibraryService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promptLibraryService.remove(id);
  }

  @Post(':id/use')
  use(@Param('id') id: string) {
    return this.promptLibraryService.incrementUseCount(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.promptLibraryService.duplicate(id);
  }
}
