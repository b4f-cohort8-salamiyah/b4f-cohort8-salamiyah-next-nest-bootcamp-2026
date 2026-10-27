import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('prisma-check')
@Controller('prisma-check')
export class PrismaCheckController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  @ApiOperation({
    summary:
      'Temporary proof-of-wiring route: real users read through Prisma/PostgreSQL, never touching Mongoose',
  })
  findUsers() {
    return this.prisma.user.findMany();
  }

  @Get('workspaces')
  @ApiOperation({
    summary:
      'Teamwork self-learned proof: each real workspace together with its own members and projects in one relational query (Prisma include), never shown in live code',
  })
  findWorkspacesWithRelations() {
    return this.prisma.workspace.findMany({
      include: {
        owner: true,
        members: { include: { user: true } },
        projects: true,
      },
    });
  }

  @Get('workspaces/:slug/full')
  @ApiOperation({
    summary:
      "Homework: a real workspace with its projects, each project's own issues, and each issue's own assignee/reporter -- three relation levels in one query",
  })
  findWorkspaceFull(@Param('slug') slug: string) {
    return this.prisma.workspace.findMany({
      where: { slug },
      include: {
        projects: {
          include: {
            issues: { include: { assignee: true, reporter: true } },
          },
        },
      },
    });
  }

  @Post('projects/:id/issues')
  @ApiOperation({
    summary:
      'Temporary proof-of-wiring route: creates a real Issue with an atomically-generated key (<PROJECT_KEY>-<N>) inside one real Prisma interactive transaction -- never a full Issues resource cutover, the existing Mongoose-backed /issues routes are untouched',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Fix navbar overflow',
        },
      },
      required: ['title'],
    },
  })
  createIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body('title') title: string,
  ) {
    return this.prisma.createIssueWithKey(id, title);
  }
}
