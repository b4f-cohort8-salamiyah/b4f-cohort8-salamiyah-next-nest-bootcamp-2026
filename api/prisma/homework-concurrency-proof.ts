import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ARTIFICIAL_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createIssueWithKeySlow(projectId: number, title: string) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id: projectId },
      data: { issueSeq: { increment: 1 } },
    });

    await sleep(ARTIFICIAL_DELAY_MS);

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

async function timeIt(label: string, fn: () => Promise<unknown[]>) {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  console.log(label, '-- elapsed ms:', elapsed);
  return { result, elapsed };
}

async function main() {
  const web = await prisma.project.findFirstOrThrow({ where: { key: 'WEB' } });
  const api = await prisma.project.findFirstOrThrow({ where: { key: 'API' } });

  const same = await timeIt(
    'SAME project (expect ~2x the artificial delay -- serialized by the real row lock)',
    () =>
      Promise.all([
        createIssueWithKeySlow(web.id, 'Homework proof: same-project A'),
        createIssueWithKeySlow(web.id, 'Homework proof: same-project B'),
      ]),
  );

  const different = await timeIt(
    'DIFFERENT projects (expect ~1x the artificial delay -- genuinely parallel)',
    () =>
      Promise.all([
        createIssueWithKeySlow(web.id, 'Homework proof: different-project A'),
        createIssueWithKeySlow(api.id, 'Homework proof: different-project B'),
      ]),
  );

  const serializedAsExpected = same.elapsed >= ARTIFICIAL_DELAY_MS * 1.8;
  const parallelAsExpected = different.elapsed < ARTIFICIAL_DELAY_MS * 1.5;

  console.log('');
  console.log(
    'Same-project calls serialized as expected:',
    serializedAsExpected,
  );
  console.log(
    'Different-project calls stayed parallel as expected:',
    parallelAsExpected,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
