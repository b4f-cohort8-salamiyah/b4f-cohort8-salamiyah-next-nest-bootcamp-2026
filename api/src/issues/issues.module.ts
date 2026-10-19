import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Issue, IssueSchema } from './schemas/issue.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Issue.name, schema: IssueSchema }]),
    JwtModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService, InternalToolGuard, JwtAuthGuard],
})
export class IssuesModule {}
