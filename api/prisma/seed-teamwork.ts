// prisma/seed-teamwork.ts
// npx ts-node prisma/seed-teamwork.ts

import { PrismaClient, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Optional safety for reruns
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const lina = await prisma.user.create({
    data: {
      name: 'Lina Haddad',
      email: 'lina@b4fdemo.local',
      passwordHash: 'x',
    },
  });

  const omar = await prisma.user.create({
    data: {
      name: 'Omar Saleh',
      email: 'omar@b4fdemo.local',
      passwordHash: 'x',
    },
  });

  const rami = await prisma.user.create({
    data: {
      name: 'Rami Younes',
      email: 'rami@b4fdemo.local',
      passwordHash: 'x',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Zaid Mansour',
      email: 'zaid@b4fdemo.local',
      passwordHash: 'x',
    },
  });

  await prisma.workspace.create({
    data: {
      name: 'Acme Robotics',
      slug: 'acme-robotics',
      ownerId: lina.id,

      members: {
        create: [
          {
            userId: lina.id,
            role: WorkspaceRole.owner,
          },
          {
            userId: omar.id,
            role: WorkspaceRole.member,
          },
          {
            userId: rami.id,
            role: WorkspaceRole.admin,
          },
        ],
      },

      projects: {
        create: [
          {
            key: 'WEB',
            name: 'Web App',
            description: 'Customer UI',
          },
          {
            key: 'API',
            name: 'Backend API',
            description: 'Core services',
          },
        ],
      },
    },
  });

  await prisma.workspace.create({
    data: {
      name: 'Nebula Labs',
      slug: 'nebula-labs',
      ownerId: omar.id,

      members: {
        create: [
          {
            userId: omar.id,
            role: WorkspaceRole.owner,
          },
        ],
      },

      projects: {
        create: [
          {
            key: 'MOB',
            name: 'Mobile App',
            description: 'iOS and Android',
          },
        ],
      },
    },
  });

  console.log('Teamwork seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
