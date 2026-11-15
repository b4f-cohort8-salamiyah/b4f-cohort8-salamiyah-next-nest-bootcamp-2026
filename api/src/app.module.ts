import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ConfigModule } from '@nestjs/config';
import { IssuesModule } from './issues/issues.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommentsModule } from './comments/comments.module';
import { ActivityModule } from './activity/activity.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SprintsModule } from './sprints/sprints.module';

// MongooseModule/MONGODB_URI removed for real -- every resource is now Prisma/PostgreSQL-backed
// (see context/DECISION-LOG.md's bootcamp-backend-completion-audit-and-session22-rebuild entry).
// The app genuinely does not need MongoDB running to boot anymore.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    WorkspacesModule,
    IssuesModule,
    AuthModule,
    CommentsModule,
    ActivityModule,
    NotificationsModule,
    SprintsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
