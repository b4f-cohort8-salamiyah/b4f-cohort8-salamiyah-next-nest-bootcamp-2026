import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async createIssueWithKey(projectId: number, title: string) {
    return this.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { issueSeq: { increment: 1 } },
      });

      return tx.issue.create({
        data: {
          projectId,
          key: `${project.key}-${project.issueSeq}`,
          title,
          status: 'todo',
        },
      });
    });
  }
}
