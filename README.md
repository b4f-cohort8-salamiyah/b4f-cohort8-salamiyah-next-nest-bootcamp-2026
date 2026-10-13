# B4F Cohort 8 — Salamiyah — Next/Nest Bootcamp Main Project (2026)

Student-facing repository for **B4F Board**, the main classroom project of B4F Bootcamp 2026 — a
Jira-style project management application, built after the B4F Hub bridge project.

## What this project is

B4F Board is where the full Bootcamp stack comes together: a **Next.js** (TypeScript, App Router)
frontend styled with **Tailwind CSS**, talking to an independent **NestJS** backend API, with real
authentication and a real database.

The backend and frontend are deliberately separate applications — the backend owns business rules,
authentication, validation, and data access; the frontend owns the web UI and interaction. This
separation is what would let a future client (for example a mobile app) reuse the same backend.

## Database learning journey

The project uses two different databases at different learning stages, on purpose: **MongoDB**
first (a flexible, document-based database, genuinely used for a real stage of this project — not
introduced and immediately discarded), then **PostgreSQL** as the final database, once the course
covers relational database design in depth. The choice reflects what fits the application's data
model at each stage, not a claim that one database is simply "better" than the other.

## Expected architecture (high level)

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Redux Toolkit where appropriate.
- **Backend:** NestJS — modules, controllers, services, DTOs, validation, guards, Swagger/OpenAPI
  documentation.
- **Database:** MongoDB (Mongoose) at an early stage → PostgreSQL (with an ORM) as the final store.
- **Auth:** register/login, hashed passwords, JWT, protected routes and endpoints, roles/permissions.

This describes the destination at a high level, not a finished design. The detailed domain model,
screens, and API surface are specified separately as the course approaches this project, and are
not part of this repository yet.

## Repository structure

At this stage the repository holds only its foundation. Application code is added once the course
actually reaches this project — this README will be extended as that content lands.

```
.
├── README.md     this file
└── .gitignore
```

## Setup

Setup instructions will be added once the first application code is published here.

## Branch model

- **`main`** — protected, instructor-managed baseline. Students do not push to `main` directly.
- **Student branches** — each enrolled student receives one permanent branch in this repository,
  named after their verified GitHub username. Branch provisioning happens once the course roster
  is finalized; it has not happened yet as of this repository's creation.
- **Personal forks** — you are always welcome to fork this repository into your own GitHub account
  to freely practice feature branches, pull requests, merging, and recovering from mistakes, on
  your own time. That is separate from your assigned branch here, and has no effect on it.

## Instructor/base branch expectations

`main` is updated only by the instructor, and reflects the official state of the course at any
given point. Students work on their own assigned branch and pull instructor updates from `main`
into it as the course progresses. A full Git/GitHub handbook will be published here before student
branches are created.

## A note on what you'll see here

You will never find the completed final version of this project in this repository ahead of time.
You'll build it, session by session, with the class.
