import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
}
