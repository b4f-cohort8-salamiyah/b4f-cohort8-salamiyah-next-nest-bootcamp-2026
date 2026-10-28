import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DELAY_MS = 1000;

/*
STRETCH — Prisma vs. Block 4 raw SQL transaction

1. BEGIN:
   Prisma equivalent: prisma.$transaction(async (tx) => { ... })
   The callback runs inside an interactive transaction.

2. UPDATE ... RETURNING:
   Prisma equivalent: tx.project.update({
     where: { id: projectId },
     data: { issueSeq: { increment: 1 } },
   })
   This atomically increments the counter and returns the updated project.

3. INSERT:
   Prisma equivalent: tx.issue.create({ data: { ... } })
   This inserts the new issue.

4. COMMIT:
   Prisma commits automatically when the transaction callback succeeds.

Error handling:
   If an operation throws, Prisma rolls back the transaction automatically.
   Raw SQL code must explicitly handle rollback on the error path.


CHALLENGE — Prisma raw SQL

1. $queryRaw returns query results, usually for SELECT.
   $executeRaw executes commands such as UPDATE or DELETE and returns
   the number of affected rows. Both can be used inside an interactive
   transaction through tx.$queryRaw and tx.$executeRaw.

2. SELECT ... FOR UPDATE locks a selected row so another transaction
   cannot modify it incompatibly until the transaction ends. It is useful
   when reading a value, making a decision, and then updating the row.

3. Our createIssueWithKey() does not need SELECT ... FOR UPDATE:
   it increments issueSeq directly using UPDATE. PostgreSQL automatically
   locks the updated row until the transaction finishes.

4. Explicit-lock sketch (research only; not used by this implementation):

   const rows = await tx.$queryRaw<
     Array<{ id: number; key: string; issue_seq: number }>
   >`
     SELECT id, key, issue_seq
     FROM projects
     WHERE id = ${projectId}
     FOR UPDATE
   `;

   This sketch would need to check that the project exists, then update
   its counter and create the issue within the same transaction.

5. The explicit SELECT ... FOR UPDATE version is not inherently more
   correct for our current unconditional increment. UPDATE already locks
   the affected row. Explicit locking is useful when a read-and-decide
   step must be protected from concurrent changes.

6. Tagged-template parameters keep interpolated values separate from
   SQL syntax. Concatenating untrusted input into a SQL string can allow
   that input to change the query's meaning, causing SQL injection.
   Avoid unsafe raw-string construction and unsafe use of Prisma.raw.
*/

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createIssueWithKeyDelayed(projectId: number, title: string) {
  return prisma.$transaction(async (tx) => {
    // UPDATE obtains a row-level lock on this project's row.
    const project = await tx.project.update({
      where: { id: projectId },
      data: { issueSeq: { increment: 1 } },
    });

    // Keep the transaction open while the row lock is held.
    await delay(DELAY_MS);

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

async function measure(
  label: string,
  calls: Array<Promise<unknown>>,
): Promise<number> {
  const start = Date.now();
  await Promise.all(calls);
  const elapsed = Date.now() - start;

  console.log(`${label}: ${elapsed} ms`);
  return elapsed;
}

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { id: 'asc' },
    take: 2,
    select: { id: true, key: true },
  });

  if (projects.length < 2) {
    throw new Error(
      'The test needs at least two existing projects in the database.',
    );
  }

  const [projectA, projectB] = projects;

  console.log('Projects:', projectA, projectB);
  console.log(`Artificial delay per transaction: ${DELAY_MS} ms\n`);

  console.log('Testing two concurrent creates on the SAME project...');
  const sameProjectElapsed = await measure('Same-project elapsed', [
    createIssueWithKeyDelayed(projectA.id, `Homework same A ${Date.now()}`),
    createIssueWithKeyDelayed(projectA.id, `Homework same B ${Date.now()}`),
  ]);

  console.log('\nTesting two concurrent creates on DIFFERENT projects...');
  const differentProjectElapsed = await measure('Different-project elapsed', [
    createIssueWithKeyDelayed(
      projectA.id,
      `Homework different A ${Date.now()}`,
    ),
    createIssueWithKeyDelayed(
      projectB.id,
      `Homework different B ${Date.now()}`,
    ),
  ]);

  // Compare the measurements with a tolerance for database/runtime overhead.
  const sameProjectSerialized = sameProjectElapsed >= DELAY_MS * 1.7;

  const differentProjectsParallel =
    differentProjectElapsed < sameProjectElapsed - DELAY_MS * 0.5;

  console.log('\n--- Results ---');
  console.log(`Same-project calls were serialized: ${sameProjectSerialized}`);
  console.log(
    `Different-project calls stayed parallel: ${differentProjectsParallel}`,
  );

  if (!sameProjectSerialized || !differentProjectsParallel) {
    console.error(
      '\nThe timing proof did not meet its thresholds. ' +
        'Inspect the measurements and database connection pool before concluding.',
    );
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
