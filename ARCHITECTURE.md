# Architecture Overview

## Summary

This app will use a React + TypeScript frontend and a lightweight backend with
a relational database. The first version should prioritize clear data flow and
low setup overhead over maximum flexibility.

## Proposed Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js with a minimal TypeScript API layer
- Database: PostgreSQL or a hosted Postgres-compatible service
- Deployment: Frontend and backend deployed separately if needed

This stack is intentionally mainstream enough to be portfolio-relevant while
still mapping well to the user's prior backend experience.

## High-Level Components

- Browser UI
  - Renders lists and todos
  - Handles forms, local UI state, and filter state
- API layer
  - Exposes CRUD operations for lists and todos
  - Validates incoming data
  - Talks to the database
- Database
  - Stores lists and todos persistently

## Data Model

### lists

- `id`
- `name`
- `created_at`
- `updated_at`

### todos

- `id`
- `list_id`
- `title`
- `completed`
- `due_date`
- `notes`
- `created_at`
- `updated_at`

Relationship:
- One list has many todos
- One todo belongs to one list

## Request Flow

1. The user interacts with the React UI.
2. A component event handler updates temporary UI state or submits a request.
3. The frontend calls the API with `fetch`.
4. The API validates input and performs a database read or write.
5. The API returns JSON.
6. The frontend updates rendered state based on the response.

## Why This Shape First

- It keeps React concepts visible instead of hiding them behind heavy client
  libraries too early.
- It preserves a clean separation between UI concerns and persistence logic.
- It gives us a path to add stronger patterns later only if the simple version
  starts to hurt.

## Future Refactor Points

- Introduce a client-side data fetching library if manual fetch state becomes
  repetitive.
- Add schema validation utilities if request handling logic spreads.
- Revisit backend hosting and deployment shape after the first working version.
