import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { FindIssuesQueryDto } from './dto/find-issues-query.dto';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

const INTERNAL_TOOL_HEADER = {
  name: 'x-internal-tool-key',
  description:
    'Required internal-tool access key (value not published here). This is access control, not authentication -- it does not identify who is calling.',
  required: true,
};

@ApiTags('issues')
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @ApiOperation({ summary: 'List issues, optionally filtered by projectId' })
  @Get()
  findAll(@Query() query: FindIssuesQueryDto) {
    return this.issuesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get one issue by its id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create an issue (internal tool only)' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Post()
  create(@Body() dto: CreateIssueDto) {
    return this.issuesService.create(dto);
  }

  @ApiOperation({ summary: 'Update an issue (internal tool only)' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an issue (internal tool only)' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }
}
