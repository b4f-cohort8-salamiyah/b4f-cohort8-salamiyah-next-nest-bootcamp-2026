import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const HOLD_MS = 1000; 

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


async function createIssueWithKeyDelayed(projectId: number, title: string) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id: projectId },
      data: { issueSeq: { increment: 1 } },
    });

    await sleep(HOLD_MS); 

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


async function timeConcurrent(projectA: number, projectB: number) {
  const start = Date.now();
  await Promise.all([
    createIssueWithKeyDelayed(projectA, 'HW concurrent A'),
    createIssueWithKeyDelayed(projectB, 'HW concurrent B'),
  ]);
  return Date.now() - start;
}

async function main() {
  
  const projects = await prisma.project.findMany({
    orderBy: { id: 'asc' },
    take: 2,
  });
  if (projects.length < 2) {
    throw new Error('Need at least 2 real projects in the database');
  }
  const [p1, p2] = projects;

  
  const singleStart = Date.now();
  await createIssueWithKeyDelayed(p1.id, 'HW single call');
  const singleMs = Date.now() - singleStart;

 
  const sameMs = await timeConcurrent(p1.id, p1.id);

  const diffMs = await timeConcurrent(p1.id, p2.id);

 
  const sameSerialized = sameMs >= singleMs * 1.8;
  const diffParallel = diffMs < singleMs * 1.5;

  console.log('single call (baseline):', singleMs, 'ms');
  console.log('A same project   :', sameMs, 'ms');
  console.log('B different proj :', diffMs, 'ms');
  console.log('same-project serialized     :', sameSerialized);
  console.log('different-project in parallel:', diffParallel);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
