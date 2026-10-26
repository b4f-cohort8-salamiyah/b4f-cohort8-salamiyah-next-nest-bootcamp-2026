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
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

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

  @ApiOperation({
    summary: 'Create an issue (requires target-workspace membership)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'The created issue.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'The reporter or assignee is not a member of the project workspace.',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateIssueDto, @CurrentUser() user: JwtPayload) {
    return this.issuesService.create(dto, user.sub);
  }

  @ApiOperation({
    summary:
      'Update an issue (reporter, assignee, workspace Owner, or Admin only)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The updated issue.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Not the issue reporter or assignee, and not a workspace Owner or Admin.',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.issuesService.update(id, dto, user.sub);
  }

  @ApiOperation({
    summary:
      'Delete an issue (reporter, assignee, workspace Owner, or Admin only)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The deleted issue.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Not the issue reporter or assignee, and not a workspace Owner or Admin.',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.issuesService.remove(id, user.sub);
  }
}
