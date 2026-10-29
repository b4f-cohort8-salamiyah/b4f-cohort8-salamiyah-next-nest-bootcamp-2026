import { Module } from '@nestjs/common';
import { PrismaCheckController } from './prisma-check.controller';

@Module({
  controllers: [PrismaCheckController],
})
export class PrismaCheckModule {}
