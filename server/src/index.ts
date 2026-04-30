import cors from "cors";
import express from "express";
import { db } from "./db.js";

type ListRow = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

type TodoRow = {
  id: number;
  list_id: number;
  title: string;
  completed: number;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/lists", (_request, response) => {
  const rows = db
    .prepare("SELECT id, name, created_at, updated_at FROM lists ORDER BY id ASC")
    .all() as ListRow[];

  response.json(rows.map(serializeList));
});

app.post("/api/lists", (request, response) => {
  const name = toNonEmptyString(request.body?.name, "List name is required");

  const result = db
    .prepare(
      `
        INSERT INTO lists (name, created_at, updated_at)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    )
    .run(name);

  const row = db
    .prepare("SELECT id, name, created_at, updated_at FROM lists WHERE id = ?")
    .get(result.lastInsertRowid) as ListRow | undefined;

  response.status(201).json(serializeList(row!));
});

app.patch("/api/lists/:id", (request, response) => {
  const listId = toId(request.params.id);
  const name = toNonEmptyString(request.body?.name, "List name is required");

  const result = db
    .prepare(
      `
        UPDATE lists
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
    .run(name, listId);

  if (result.changes === 0) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const row = db
    .prepare("SELECT id, name, created_at, updated_at FROM lists WHERE id = ?")
    .get(listId) as ListRow;

  response.json(serializeList(row));
});

app.delete("/api/lists/:id", (request, response) => {
  const listId = toId(request.params.id);

  const result = db.prepare("DELETE FROM lists WHERE id = ?").run(listId);

  if (result.changes === 0) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  response.json({ success: true });
});

app.get("/api/lists/:id/todos", (request, response) => {
  const listId = toId(request.params.id);
  const list = db.prepare("SELECT id FROM lists WHERE id = ?").get(listId);

  if (!list) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const rows = db
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE list_id = ?
        ORDER BY id DESC
      `
    )
    .all(listId) as TodoRow[];

  response.json(rows.map(serializeTodo));
});

app.post("/api/todos", (request, response) => {
  const listId = toId(request.body?.listId);
  const title = toNonEmptyString(request.body?.title, "Todo title is required");
  const dueDate = toOptionalDate(request.body?.dueDate);
  const notes = toOptionalString(request.body?.notes);

  const list = db.prepare("SELECT id FROM lists WHERE id = ?").get(listId);

  if (!list) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const result = db
    .prepare(
      `
        INSERT INTO todos (list_id, title, completed, due_date, notes, created_at, updated_at)
        VALUES (?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    )
    .run(listId, title, dueDate, notes);

  const row = db
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE id = ?
      `
    )
    .get(result.lastInsertRowid) as TodoRow;

  response.status(201).json(serializeTodo(row));
});

app.patch("/api/todos/:id", (request, response) => {
  const todoId = toId(request.params.id);
  const existing = db
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE id = ?
      `
    )
    .get(todoId) as TodoRow | undefined;

  if (!existing) {
    response.status(404).json({ error: "Todo not found" });
    return;
  }

  const title =
    request.body?.title === undefined
      ? existing.title
      : toNonEmptyString(request.body.title, "Todo title is required");
  const completed =
    request.body?.completed === undefined
      ? Boolean(existing.completed)
      : toBoolean(request.body.completed);
  const dueDate =
    request.body?.dueDate === undefined
      ? existing.due_date
      : toOptionalDate(request.body.dueDate);
  const notes =
    request.body?.notes === undefined
      ? existing.notes
      : toOptionalString(request.body.notes);

  db.prepare(
    `
      UPDATE todos
      SET title = ?, completed = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).run(title, completed ? 1 : 0, dueDate, notes, todoId);

  const row = db
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE id = ?
      `
    )
    .get(todoId) as TodoRow;

  response.json(serializeTodo(row));
});

app.delete("/api/todos/:id", (request, response) => {
  const todoId = toId(request.params.id);
  const result = db.prepare("DELETE FROM todos WHERE id = ?").run(todoId);

  if (result.changes === 0) {
    response.status(404).json({ error: "Todo not found" });
    return;
  }

  response.json({ success: true });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(400).json({ error: message });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

function serializeList(row: ListRow) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeTodo(row: TodoRow) {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    completed: Boolean(row.completed),
    dueDate: row.due_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toId(value: unknown) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error("A valid id is required");
  }

  return number;
}

function toNonEmptyString(value: unknown, message: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(message);
  }

  return value.trim();
}

function toOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Notes must be plain text");
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Due date must use YYYY-MM-DD");
  }

  return value;
}

function toBoolean(value: unknown) {
  if (typeof value !== "boolean") {
    throw new Error("Completed must be a boolean");
  }

  return value;
}
