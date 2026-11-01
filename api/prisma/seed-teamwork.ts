// prisma/seed-teamwork.ts
// npx ts-node prisma/seed-teamwork.ts

import { PrismaClient, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cleanup in FK-safe order for reruns
  await prisma.issue.deleteMany();
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

  const zaid = await prisma.user.create({
    data: {
      name: 'Zaid Mansour',
      email: 'zaid@b4fdemo.local',
      passwordHash: 'x',
    },
  });

  const acme = await prisma.workspace.create({
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
            issueSeq: 2,
          },
          {
            key: 'API',
            name: 'Backend API',
            description: 'Core services',
            issueSeq: 1,
          },
        ],
      },
    },

    include: {
      projects: true,
    },
  });

  const nebula = await prisma.workspace.create({
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
            issueSeq: 1,
          },
        ],
      },
    },

    include: {
      projects: true,
    },
  });

  const webProject = acme.projects.find((project) => project.key === 'WEB');

  const apiProject = acme.projects.find((project) => project.key === 'API');

  const mobileProject = nebula.projects.find(
    (project) => project.key === 'MOB',
  );

  if (!webProject || !apiProject || !mobileProject) {
    throw new Error('Expected seeded projects were not created.');
  }

  await prisma.issue.createMany({
    data: [
      {
        projectId: webProject.id,
        key: 'WEB-1',
        title: 'Fix navbar overflow',
        status: 'in_progress',
        assigneeId: omar.id,
        reporterId: rami.id,
      },
      {
        projectId: webProject.id,
        key: 'WEB-2',
        title: 'Add dark mode',
        status: 'todo',
        assigneeId: zaid.id,
        reporterId: lina.id,
      },
      {
        projectId: apiProject.id,
        key: 'API-1',
        title: 'Rate limit login',
        status: 'todo',
        assigneeId: rami.id,
        reporterId: lina.id,
      },
      {
        projectId: mobileProject.id,
        key: 'MOB-1',
        title: 'Crash on launch',
        status: 'in_progress',
        assigneeId: omar.id,
        reporterId: omar.id,
      },
    ],
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

// Reset index for an autoincrement id
// SELECT setval(
//     pg_get_serial_sequence('issues', 'id'),
//     COALESCE((SELECT MAX(id) FROM issues), 0) + 1,
//     false
// );
