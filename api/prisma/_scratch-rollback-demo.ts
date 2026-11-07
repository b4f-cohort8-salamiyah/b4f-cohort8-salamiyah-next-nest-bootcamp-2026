import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({ where: { key: 'WEB' } });
  const before = await prisma.project.findUnique({ where: { id: project.id } });

  try {
    await prisma.$transaction(async (tx) => {
      const p = await tx.project.update({
        where: { id: project.id },
        data: { issueSeq: { increment: 1 } },
      });

      await tx.issue.create({
        data: {
          projectId: project.id,
          key: `${p.key}-${p.issueSeq}`,
          title: 'ROLLBACK-PROOF-SHOULD-NOT-EXIST',
          status: 'todo',
        },
      });

      throw new Error('deliberate failure to prove rollback, AFTER the create');
    });
  } catch (error) {
    console.log('caught:', (error as Error).message);
  }

  const after = await prisma.project.findUnique({ where: { id: project.id } });
  const orphan = await prisma.issue.findFirst({
    where: { title: 'ROLLBACK-PROOF-SHOULD-NOT-EXIST' },
  });
  console.log('issueSeq before:', before?.issueSeq, 'after:', after?.issueSeq);
  console.log('orphan issue row (should be null):', orphan);
}

main().finally(() => prisma.$disconnect());
