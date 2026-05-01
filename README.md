# To Do List App

Simple full-stack to do list app built as a React + TypeScript learning
project. The app supports multiple lists, todo completion, due dates, plain-text
notes, and filtering.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Express, TypeScript
- Database: SQLite

## Current Features

- Create, rename, and delete lists
- Create, edit, complete, and delete todos
- Optional due dates
- Optional plain-text notes
- Filter by `all`, `active`, and `completed`
- SQLite persistence
- Server-side CRUD tests

## Run Locally

Install dependencies:

```bash
npm install
```

Build the app:

```bash
npm run build
```

Start the server:

```bash
npm start
```

Open:

- [http://localhost:3001](http://localhost:3001)

The Express server serves both the API and the built frontend.

## Deploy on Railway

This app can be deployed to Railway as a single Node service, but SQLite needs
persistent storage. Railway's current docs say volumes persist service data and
expose the mount path through `RAILWAY_VOLUME_MOUNT_PATH`, while the app must
listen on the injected `PORT` variable.

Relevant Railway docs:
- [Volumes](https://docs.railway.com/volumes)
- [Healthchecks](https://docs.railway.com/deployments/healthchecks)
- [Build and start commands](https://docs.railway.com/reference/build-and-start-commands)
- [Config as code](https://docs.railway.com/config-as-code/reference)

### Railway setup

1. Push the repo to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Add a Volume to the web service.
4. Mount the volume anywhere you like, for example `/data`.
5. Deploy.

You do not need to manually set `DB_PATH` if the service has a Railway volume.
The app will automatically detect `RAILWAY_VOLUME_MOUNT_PATH` and store the
SQLite database there as `todolist.sqlite`.

### Config included in the repo

The repo now includes [railway.toml](./railway.toml) with:
- build command: `npm run build`
- start command: `npm start`
- healthcheck path: `/api/health`

### Important note about SQLite on Railway

SQLite is acceptable for this project on Railway only if you attach a volume.
Without a volume, the filesystem may not persist app data across deployments or
restarts.

## Developer Workflow

Tests:

```bash
npm test
```

Build everything:

```bash
npm run build
```

Frontend-only dev server:

```bash
npm run dev:client
```

Backend-only dev server:

```bash
npm run dev:server
```

Combined dev command:

```bash
npm run dev
```

Note:
- In restricted environments, `tsx watch` can fail because it uses local IPC
  sockets. If that happens, use `npm run build` and `npm start` instead.

## Project Structure

```text
client/   React frontend
server/   Express API and SQLite access
docs/     ADRs
```

## Tests

The current automated tests focus on the critical backend CRUD path and due
date validation.

## Learning Notes

- Scope was intentionally constrained to a single-user v1.
- The code started with plain React state and explicit fetch calls before adding
  heavier abstractions.
- Architectural decisions are tracked in [docs/adr/0001-backend-choice.md](./docs/adr/0001-backend-choice.md).
