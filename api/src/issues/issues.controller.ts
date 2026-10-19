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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { FindIssuesQueryDto } from './dto/find-issues-query.dto';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

@ApiTags('issues')
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @ApiOperation({
    summary: 'List issues, optionally filtered by projectId and/or status',
  })
  @Get()
  findAll(@Query() query: FindIssuesQueryDto) {
    return this.issuesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get one issue by its id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create an issue' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'The created issue.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateIssueDto) {
    return this.issuesService.create(dto);
  }

  @ApiOperation({ summary: 'Update an issue' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The updated issue.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an issue' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The deleted issue.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }
}
