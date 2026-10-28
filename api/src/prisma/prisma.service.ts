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
  // SQL           ->         Prisma
  //
  // BEGIN                  -> this.$transaction(async (tx) => { ... })
  //                           opens the transaction; every call through `tx` belongs to it.
  // UPDATE ... RETURNING   -> tx.project.update({ data: { issueSeq: { increment: 1 } } })
  //                           increments issue_seq inside Postgres and returns the
  //                           updated row, so project.issueSeq is the reserved number.
  // INSERT                 -> tx.issue.create({ data: { key: `${project.key}-${project.issueSeq}` ... } })
  //                           creates the issue using the value returned above.
  // COMMIT                 -> the callback returning normally (no throw).
  //                           Prisma issues COMMIT itself and releases the row lock.
  //
  // Handled automatically by Prisma: ROLLBACK. In raw SQL I must write ROLLBACK
  // by hand on the error path. Here, if anything inside the callback throws,
  // Prisma rolls back BOTH the increment and the insert, releases the lock,
  // and rethrows. (Proven earlier: issueSeq unchanged, no orphan issue row.)
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
