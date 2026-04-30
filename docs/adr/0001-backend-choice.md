# ADR 0001: Backend and Database Choice for V1

## Status

Accepted

## Context

The project goal is to learn React and TypeScript while still shipping a real
full-stack app. The first version is intentionally single-user, with no auth
or sharing. That means backend complexity should stay proportional to the scope.

## Decision

Use:

- React + TypeScript + Vite for the frontend
- Express + TypeScript for the backend API
- SQLite for the v1 database

## Why

- Express keeps the API shape explicit and easy to map to prior backend
  experience.
- TypeScript is used on both sides, which reduces context switching while the
  user is learning.
- SQLite removes infrastructure setup friction during early learning and still
  gives us a real relational data model.
- This stack supports the current scope without forcing auth, hosted services,
  or deployment-specific database setup too early.

## Alternatives Considered

### Hosted backend platform

This would reduce backend code, but it would also hide some of the data-access
 logic that is useful for learning full-stack CRUD.

### PostgreSQL from the start

This is a reasonable future upgrade, but it adds environment setup and
deployment complexity before the app's core behavior is proven.

## Consequences

- Local setup becomes simpler.
- The app remains easy to reason about while learning React fundamentals.
- If we later add auth, sharing, or multi-user permissions, we may need to
  revisit the backend and database choice.
