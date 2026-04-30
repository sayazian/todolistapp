import type { DatabaseConnection } from "./db.js";

export type ListRecord = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TodoRecord = {
  id: number;
  listId: number;
  title: string;
  completed: boolean;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export function listLists(database: DatabaseConnection) {
  const rows = database
    .prepare("SELECT id, name, created_at, updated_at FROM lists ORDER BY id ASC")
    .all() as ListRow[];

  return rows.map(serializeList);
}

export function createList(database: DatabaseConnection, nameInput: unknown) {
  const name = toNonEmptyString(nameInput, "List name is required");

  const result = database
    .prepare(
      `
        INSERT INTO lists (name, created_at, updated_at)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    )
    .run(name);

  const row = database
    .prepare("SELECT id, name, created_at, updated_at FROM lists WHERE id = ?")
    .get(result.lastInsertRowid) as ListRow;

  return serializeList(row);
}

export function renameList(
  database: DatabaseConnection,
  listIdInput: unknown,
  nameInput: unknown
) {
  const listId = toId(listIdInput);
  const name = toNonEmptyString(nameInput, "List name is required");

  const result = database
    .prepare(
      `
        UPDATE lists
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
    .run(name, listId);

  if (result.changes === 0) {
    return null;
  }

  const row = database
    .prepare("SELECT id, name, created_at, updated_at FROM lists WHERE id = ?")
    .get(listId) as ListRow;

  return serializeList(row);
}

export function deleteList(database: DatabaseConnection, listIdInput: unknown) {
  const listId = toId(listIdInput);
  return database.prepare("DELETE FROM lists WHERE id = ?").run(listId).changes > 0;
}

export function listTodosForList(
  database: DatabaseConnection,
  listIdInput: unknown
) {
  const listId = toId(listIdInput);
  const list = database.prepare("SELECT id FROM lists WHERE id = ?").get(listId);

  if (!list) {
    return null;
  }

  const rows = database
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE list_id = ?
        ORDER BY id DESC
      `
    )
    .all(listId) as TodoRow[];

  return rows.map(serializeTodo);
}

export function createTodo(
  database: DatabaseConnection,
  input: {
    listId: unknown;
    title: unknown;
    dueDate?: unknown;
    notes?: unknown;
  }
) {
  const listId = toId(input.listId);
  const title = toNonEmptyString(input.title, "Todo title is required");
  const dueDate = toOptionalDate(input.dueDate);
  const notes = toOptionalString(input.notes);
  const list = database.prepare("SELECT id FROM lists WHERE id = ?").get(listId);

  if (!list) {
    return null;
  }

  const result = database
    .prepare(
      `
        INSERT INTO todos (list_id, title, completed, due_date, notes, created_at, updated_at)
        VALUES (?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    )
    .run(listId, title, dueDate, notes);

  const row = database
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE id = ?
      `
    )
    .get(result.lastInsertRowid) as TodoRow;

  return serializeTodo(row);
}

export function updateTodo(
  database: DatabaseConnection,
  todoIdInput: unknown,
  input: {
    title?: unknown;
    completed?: unknown;
    dueDate?: unknown;
    notes?: unknown;
  }
) {
  const todoId = toId(todoIdInput);
  const existing = database
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE id = ?
      `
    )
    .get(todoId) as TodoRow | undefined;

  if (!existing) {
    return null;
  }

  const title =
    input.title === undefined
      ? existing.title
      : toNonEmptyString(input.title, "Todo title is required");
  const completed =
    input.completed === undefined
      ? Boolean(existing.completed)
      : toBoolean(input.completed);
  const dueDate =
    input.dueDate === undefined ? existing.due_date : toOptionalDate(input.dueDate);
  const notes =
    input.notes === undefined ? existing.notes : toOptionalString(input.notes);

  database
    .prepare(
      `
        UPDATE todos
        SET title = ?, completed = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
    .run(title, completed ? 1 : 0, dueDate, notes, todoId);

  const row = database
    .prepare(
      `
        SELECT id, list_id, title, completed, due_date, notes, created_at, updated_at
        FROM todos
        WHERE id = ?
      `
    )
    .get(todoId) as TodoRow;

  return serializeTodo(row);
}

export function deleteTodo(database: DatabaseConnection, todoIdInput: unknown) {
  const todoId = toId(todoIdInput);
  return database.prepare("DELETE FROM todos WHERE id = ?").run(todoId).changes > 0;
}

function serializeList(row: ListRow): ListRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeTodo(row: TodoRow): TodoRecord {
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
