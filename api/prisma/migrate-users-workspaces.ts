import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';

const prisma = new PrismaClient();

async function main() {
  const mongo = new MongoClient(process.env.MONGODB_URI as string);
  await mongo.connect();
  const db = mongo.db();

  const mongoUsers = await db
    .collection('users')
    .find()
    .sort({ id: 1 })
    .toArray();
  let usersMigrated = 0;

  for (const u of mongoUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        createdAt: u.createdAt ?? new Date(),
      },
    });
    usersMigrated++;
  }

  console.log(`Mongo users found: ${mongoUsers.length}`);
  console.log(`Users migrated (upserted): ${usersMigrated}`);

  const mongoWorkspaces = await db
    .collection('workspaces')
    .find()
    .sort({ id: 1 })
    .toArray();
  let workspacesMigrated = 0;
  const skipped: { id: number; name: string; reason: string }[] = [];

  for (const w of mongoWorkspaces) {
    const ownerMember = await db
      .collection('workspacemembers')
      .findOne({ workspaceId: w.id, role: 'owner' });

    if (!ownerMember) {
      skipped.push({
        id: w.id,
        name: w.name,
        reason: 'no WorkspaceMember with role=owner found',
      });
      continue;
    }

    const ownerExists = await prisma.user.findUnique({
      where: { id: ownerMember.userId },
    });

    if (!ownerExists) {
      skipped.push({
        id: w.id,
        name: w.name,
        reason: `owner userId ${ownerMember.userId} does not exist in migrated Users`,
      });
      continue;
    }

    await prisma.workspace.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        name: w.name,
        slug: w.slug,
        description: w.description ?? '',
        ownerId: ownerMember.userId,
      },
    });
    workspacesMigrated++;
  }

  console.log(`Mongo workspaces found: ${mongoWorkspaces.length}`);
  console.log(`Workspaces migrated: ${workspacesMigrated}`);
  console.log(`Workspaces skipped: ${JSON.stringify(skipped, null, 2)}`);

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);`,
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('workspaces', 'id'), COALESCE((SELECT MAX(id) FROM workspaces), 1), true);`,
  );
  console.log(
    'Postgres autoincrement sequences synced to the real current max id.',
  );

  await mongo.close();
}

main()
  .catch((e) => {
    console.error('MIGRATION FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
