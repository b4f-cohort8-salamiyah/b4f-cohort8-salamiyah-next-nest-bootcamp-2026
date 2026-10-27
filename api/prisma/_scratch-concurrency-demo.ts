import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createIssueWithKey(projectId: number, title: string) {
  return prisma.$transaction(async (tx) => {
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

async function main() {
  const seqBefore = (
    await prisma.project.findUniqueOrThrow({ where: { id: 4 } })
  ).issueSeq;

  const [a, b] = await Promise.all([
    createIssueWithKey(4, 'Concurrent A'),
    createIssueWithKey(4, 'Concurrent B'),
  ]);

  const seqAfter = (
    await prisma.project.findUniqueOrThrow({ where: { id: 4 } })
  ).issueSeq;

  console.log('keys:', a.key, b.key, '-- duplicate?', a.key === b.key);
  console.log('issueSeq before:', seqBefore, 'after (expect +2):', seqAfter);
}

main().finally(() => prisma.$disconnect());
