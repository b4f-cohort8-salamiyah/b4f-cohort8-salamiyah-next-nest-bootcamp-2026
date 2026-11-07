import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

@ApiTags('activity')
@Controller('workspaces/:workspaceId/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiOperation({
    summary:
      "List a workspace's own real activity feed, newest first (append-only; requires membership)",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.activityService.findAllForWorkspace(
      workspaceId,
      currentUser.sub,
    );
  }
}
