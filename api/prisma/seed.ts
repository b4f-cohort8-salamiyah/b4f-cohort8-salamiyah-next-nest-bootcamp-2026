// Final classroom demo seed -- run with `npx prisma db seed` or `npm run db:seed`.
//
// RESET POLICY (deterministic reset, not idempotent upserts): every run truncates every real
// domain table (CASCADE, so FK order never matters) and restarts every autoincrement sequence
// back to 1, then recreates the exact same known demo dataset from scratch. Chosen over upserts
// because a classroom/demo seed needs the SAME predictable ids (user 1, workspace 1, project
// "WEB" with issues WEB-1..3) every single run, for live curl examples and
// SEED-AND-LIVE-TEST.md's own fixed id references -- upserts on a dataset this small would only
// add natural-key-matching complexity for no real benefit, and would let old ad hoc rows from
// manual testing linger alongside the seed. Never run this against a real production database --
// it is destructive by design, for local teaching databases only.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';
const BCRYPT_SALT_ROUNDS = 10; // matches AuthService's own real constant

async function main() {
  console.log('Resetting all domain tables (RESTART IDENTITY CASCADE)...');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "notifications", "comments", "activity_logs", "issues", "projects", "workspace_members", "workspaces", "users" RESTART IDENTITY CASCADE;`,
  );

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_SALT_ROUNDS);

  // Users -- owner, admin, two real workspace members (developer + designer), and one real
  // outsider who exists but is deliberately NOT added to the workspace below (for negative
  // authorization / invalid-member testing -- see SEED-AND-LIVE-TEST.md's own step 18).
  const lina = await prisma.user.create({
    data: {
      name: 'Lina Haddad',
      email: 'lina.owner@b4fboard.dev',
      passwordHash,
    },
  });
  const omar = await prisma.user.create({
    data: {
      name: 'Omar Rahal',
      email: 'omar.admin@b4fboard.dev',
      passwordHash,
    },
  });
  const yara = await prisma.user.create({
    data: { name: 'Yara Nassar', email: 'yara.dev@b4fboard.dev', passwordHash },
  });
  const karim = await prisma.user.create({
    data: {
      name: 'Karim Saleh',
      email: 'karim.design@b4fboard.dev',
      passwordHash,
    },
  });
  const dana = await prisma.user.create({
    data: {
      name: 'Dana Barakat',
      email: 'dana.outsider@b4fboard.dev',
      passwordHash,
    },
  });
  console.log(
    `Created 5 real users (incl. outsider "${dana.name}", deliberately not a workspace member). Password for all: ${SEED_PASSWORD}`,
  );

  // Workspace, owned by Lina.
  const workspace = await prisma.workspace.create({
    data: {
      name: 'B4F Core Team',
      slug: 'b4f-core-team',
      description: 'The real demo workspace this backend was built against.',
      ownerId: lina.id,
    },
  });

  // WorkspaceMembers: owner, admin, two real members. Dana is deliberately excluded.
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: workspace.id, userId: lina.id, role: 'owner' },
      { workspaceId: workspace.id, userId: omar.id, role: 'admin' },
      { workspaceId: workspace.id, userId: yara.id, role: 'member' },
      { workspaceId: workspace.id, userId: karim.id, role: 'member' },
    ],
  });

  // Two real projects, each with its own real key prefix and an issueSeq that matches the
  // number of issues each one actually gets below.
  const webProject = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      key: 'WEB',
      name: 'Website Revamp',
      description: 'The real public marketing site.',
      issueSeq: 3,
    },
  });
  const appProject = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      key: 'APP',
      name: 'Mobile App',
      description: 'The real native mobile client.',
      issueSeq: 2,
    },
  });

  // Issues -- real status/assignment/reporter variety across both projects.
  const webIssue1 = await prisma.issue.create({
    data: {
      projectId: webProject.id,
      key: 'WEB-1',
      title: 'Fix login button on mobile Safari',
      description:
        'It does not respond to a tap on iOS 17 Safari specifically.',
      status: 'todo',
      reporterId: omar.id,
      assigneeId: yara.id,
    },
  });
  const webIssue2 = await prisma.issue.create({
    data: {
      projectId: webProject.id,
      key: 'WEB-2',
      title: 'Redesign homepage hero section',
      description:
        'Current hero image does not scale well on real tablet breakpoints.',
      status: 'in_progress',
      reporterId: lina.id,
      assigneeId: karim.id,
    },
  });
  const webIssue3 = await prisma.issue.create({
    data: {
      projectId: webProject.id,
      key: 'WEB-3',
      title: 'Investigate flaky checkout test',
      description:
        'Fails roughly one run in five in CI, passes every time locally.',
      status: 'todo',
      reporterId: omar.id,
      assigneeId: null, // deliberately unassigned
    },
  });
  const appIssue1 = await prisma.issue.create({
    data: {
      projectId: appProject.id,
      key: 'APP-1',
      title: 'Add push notification opt-in screen',
      description:
        'Needed before the real Notifications feature can reach mobile users.',
      status: 'in_progress',
      reporterId: karim.id,
      assigneeId: omar.id,
    },
  });
  const appIssue2 = await prisma.issue.create({
    data: {
      projectId: appProject.id,
      key: 'APP-2',
      title: 'Crash on Android 12 when rotating device',
      description:
        'Reproduced on a real Pixel 6; stack trace points at the board view.',
      status: 'done',
      reporterId: yara.id,
      assigneeId: yara.id, // real reporter === assignee, a genuine real combination
    },
  });

  // Real ISSUE_CREATED activity, one per issue, actor = its own real reporter -- matches
  // IssuesService.create()'s own real transaction exactly.
  for (const issue of [webIssue1, webIssue2, webIssue3, appIssue1, appIssue2]) {
    await prisma.activityLog.create({
      data: {
        workspaceId: workspace.id,
        issueId: issue.id,
        actorId: issue.reporterId,
        action: 'ISSUE_CREATED',
        metadata: { title: issue.title, key: issue.key },
      },
    });
  }

  // Comments -- a normal comment with no mention, two real valid mentions, and one real
  // self-mention (to seed the exact "no self-notification" case alongside everything else).
  const commentA = await prisma.comment.create({
    data: {
      issueId: webIssue1.id,
      authorId: omar.id,
      body: `Thanks for picking this up @[${yara.name}](${yara.id}) -- can you also check the iPad layout while you're in there?`,
    },
  });
  const commentB = await prisma.comment.create({
    data: {
      issueId: webIssue1.id,
      authorId: yara.id,
      body: `On it! Looping in @[${karim.name}](${karim.id}) for a design opinion on the fallback button size.`,
    },
  });
  const commentC = await prisma.comment.create({
    data: {
      issueId: webIssue2.id,
      authorId: lina.id,
      body: `Noting here for my own follow-up @[${lina.name}](${lina.id}) -- revisit after design review.`,
    },
  });
  const commentD = await prisma.comment.create({
    data: {
      issueId: appIssue1.id,
      authorId: karim.id,
      body: 'I think we should use the native OS permission prompt instead of a custom modal.',
    },
  });

  // Real COMMENTED + (one real MENTIONED row per real mention, including a self-mention --
  // CommentsService.create() itself never filters self out of the ActivityLog loop, only
  // NotificationsService.notifyMentions() does, for Notifications specifically) activity, one
  // real batch per comment, matching CommentsService.create()'s own real transaction shape.
  const commentMentionPlan: {
    comment: typeof commentA;
    issueId: number;
    authorId: number;
    mentionedUserIds: number[];
  }[] = [
    {
      comment: commentA,
      issueId: webIssue1.id,
      authorId: omar.id,
      mentionedUserIds: [yara.id],
    },
    {
      comment: commentB,
      issueId: webIssue1.id,
      authorId: yara.id,
      mentionedUserIds: [karim.id],
    },
    {
      comment: commentC,
      issueId: webIssue2.id,
      authorId: lina.id,
      mentionedUserIds: [lina.id],
    },
    {
      comment: commentD,
      issueId: appIssue1.id,
      authorId: karim.id,
      mentionedUserIds: [],
    },
  ];

  for (const plan of commentMentionPlan) {
    await prisma.activityLog.create({
      data: {
        workspaceId: workspace.id,
        issueId: plan.issueId,
        actorId: plan.authorId,
        action: 'COMMENTED',
        metadata: { commentId: plan.comment.id },
      },
    });
    for (const mentionedUserId of plan.mentionedUserIds) {
      await prisma.activityLog.create({
        data: {
          workspaceId: workspace.id,
          issueId: plan.issueId,
          actorId: plan.authorId,
          action: 'MENTIONED',
          metadata: { commentId: plan.comment.id, mentionedUserId },
        },
      });
    }
  }

  // Notifications -- MENTION only (this session's own real scope). Self-mentions (commentC)
  // never produce one, matching NotificationsService.notifyMentions()'s own real actor filter.
  // One unread, one already read, two different real recipients.
  await prisma.notification.create({
    data: {
      userId: yara.id,
      type: 'MENTION',
      message: `${omar.name} mentioned you in a comment.`,
      issueId: webIssue1.id,
      commentId: commentA.id,
      actorId: omar.id,
      readAt: null, // unread
    },
  });
  await prisma.notification.create({
    data: {
      userId: karim.id,
      type: 'MENTION',
      message: `${yara.name} mentioned you in a comment.`,
      issueId: webIssue1.id,
      commentId: commentB.id,
      actorId: yara.id,
      readAt: new Date(), // already read
    },
  });

  console.log('Seed complete.');
  console.log(
    `Workspace: ${workspace.name} (slug "${workspace.slug}", id ${workspace.id})`,
  );
  console.log(
    `Members: owner=${lina.email}, admin=${omar.email}, member=${yara.email}, member=${karim.email}`,
  );
  console.log(`Outsider (not a member): ${dana.email}`);
  console.log(
    `Projects: ${webProject.key} (id ${webProject.id}), ${appProject.key} (id ${appProject.id})`,
  );
  console.log(
    'Issues:',
    [webIssue1, webIssue2, webIssue3, appIssue1, appIssue2]
      .map((i) => `${i.key}(id ${i.id})`)
      .join(', '),
  );
  console.log(`Every seeded user's real password: ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('SEED FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
