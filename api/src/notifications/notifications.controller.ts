import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    summary: "List the real signed-in user's own notifications, newest first",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(
    @CurrentUser() currentUser: JwtPayload,
    @Query('unread') unread?: string,
  ) {
    return this.notificationsService.findAllForUser(
      currentUser.sub,
      unread === 'true',
    );
  }

  @ApiOperation({ summary: "Count the signed-in user's unread notifications" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  unreadCount(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.unreadCount(currentUser.sub);
  }

  @ApiOperation({
    summary: "Mark all of the signed-in user's notifications read",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAllRead(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.markAllRead(currentUser.sub);
  }

  @ApiOperation({
    summary: "Mark one of the real signed-in user's own notifications read",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.notificationsService.markRead(id, currentUser.sub);
  }

  @ApiOperation({ summary: "Delete one of the signed-in user's notifications" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.notificationsService.remove(id, currentUser.sub);
  }
}
