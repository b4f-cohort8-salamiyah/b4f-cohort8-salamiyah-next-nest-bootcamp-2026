import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';

@ApiTags('comments')
@Controller('issues/:issueId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({
    summary:
      "List an issue's own real comments, oldest first (requires workspace membership)",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Param('issueId', ParseIntPipe) issueId: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.commentsService.findAllForIssue(issueId, currentUser.sub);
  }

  @ApiOperation({
    summary:
      'Create a comment on an issue (requires workspace membership; every real @mention must already be a member)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'The created comment.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'The caller, or a mentioned user, is not a member of this workspace.',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.commentsService.create(issueId, currentUser.sub, dto);
  }
}
