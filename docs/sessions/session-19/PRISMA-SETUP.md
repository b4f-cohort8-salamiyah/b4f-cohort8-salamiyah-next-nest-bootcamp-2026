# Session 19 Teamwork — Prisma Setup

Use this file only for the Prisma setup commands.  
The actual teamwork task is still in `TEAMWORK-EN.pdf`.

> Run all commands from inside `api/`.

---

## 1. Install Prisma

Install the exact versions used in this project:

```bash
npm install --save-exact prisma@6.7.0 @prisma/client@6.7.0
```

Check:

```bash
npx prisma -v
```

You should see Prisma Client / Prisma CLI version `6.7.0`.

---

## 2. Initialize Prisma

If the project does not already contain a `prisma/` folder:

```bash
npx prisma init --datasource-provider postgresql
```

This creates:

```text
prisma/
  schema.prisma

.env
```

The Prisma generator should be:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

The datasource should be:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 3. Create the PostgreSQL database

Create the application database once:

```bash
createdb b4f_board
```

If it already exists, do not create it again.

Your `.env` must contain a valid PostgreSQL connection string pointing to `b4f_board`.

Example shape:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/b4f_board?schema=public"
```

Do not commit `.env` to Git.

---

## 4. Validate the Prisma schema

After editing `prisma/schema.prisma`:

```bash
npx prisma validate
```

Expected:

```text
The schema at prisma/schema.prisma is valid
```

If validation fails, fix the schema before creating a migration.

---

## 5. Generate Prisma Client

```bash
npx prisma generate
```

In this project, application code imports Prisma from:

```ts
import { PrismaClient } from '@prisma/client';
```

Do not use a custom generated-client path.

---

## 6. Apply the first migration

If your database is still empty and you are creating the first three models from live code:

```bash
npx prisma migrate dev --name init_users_workspaces_members
```

Then inspect the real generated SQL inside:

```text
prisma/migrations/<timestamp>_init_users_workspaces_members/migration.sql
```

Verify the database:

```bash
psql -d b4f_board -c "\dt"
psql -d b4f_board -c "SELECT migration_name, finished_at FROM _prisma_migrations;"
```

You should see:

```text
users
workspaces
workspace_members
_prisma_migrations
```

---

## 7. Teamwork migration — Project

For the teamwork task, first add the `Project` model and the `projects Project[]` relation to `Workspace`.

Then validate:

```bash
npx prisma validate
```

Create and apply the new migration:

```bash
npx prisma migrate dev --name add_projects
```

Open the new:

```text
prisma/migrations/<timestamp>_add_projects/migration.sql
```

Before continuing, verify:

- it creates the `projects` table;
- it creates the expected unique constraint/index;
- it creates the `workspace_id` foreign key;
- `workspace_id` uses `ON DELETE CASCADE`;
- there is no unexpected `DROP`;
- there is no unexpected destructive `ALTER COLUMN`.

Check the database:

```bash
psql -d b4f_board -c "\dt"
```

You should now also see:

```text
projects
```

---

## 8. Important distinction

Remember:

```text
schema.prisma
    ↓
describes the desired database structure

prisma migrate dev
    ↓
generates real SQL + applies it to PostgreSQL

Prisma Client
    ↓
lets TypeScript/NestJS query the database
```

`schema.prisma` is **not** SQL.

Do not write SQL such as:

```sql
CREATE TABLE ...
CREATE TYPE ...
```

inside `schema.prisma`.

Prisma generates that SQL for you inside the migration files.

---

## 9. Do not reset the database during teamwork

Do not run:

```bash
npx prisma migrate reset
```

unless the instructor explicitly tells you to.

The goal is to add the `Project` migration **without destroying the existing User / Workspace / WorkspaceMember data or migration history**.

---

## Ready for the teamwork task

Once this succeeds:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev --name add_projects
```

continue with the teamwork task:

1. research Prisma `include`;
2. build `GET /prisma-check/workspaces`;
3. seed real relational data through Prisma Client;
4. prove the new Prisma route works;
5. prove the existing Mongoose `GET /workspaces` route is unchanged.
