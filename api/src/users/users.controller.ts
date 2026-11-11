import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { SearchUsersDto } from './dto/search-users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary:
      'INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- search real users by name/email, scoped to a real workspace membership direction (add-member vs. @mention).',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(
    @Query() query: SearchUsersDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.search(currentUser.sub, query);
  }

  @ApiOperation({
    summary:
      'List issues assigned to the signed-in user across current workspace memberships',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/issues')
  myIssues(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.myIssues(currentUser.sub);
  }

  @ApiOperation({
    summary:
      "List recent activity across the signed-in user's current workspaces",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/activity')
  myActivity(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.myActivity(currentUser.sub);
  }

  @ApiOperation({
    summary:
      'Resolve a user id into its public identity (id/name only -- never email or the password hash)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findPublicById(id);

    if (!user) {
      throw new NotFoundException(`No user found with id ${id}.`);
    }

    return user;
  }
}
