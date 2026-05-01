import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createDatabase } from "./db.js";
import {
  createList,
  createTodo,
  deleteList,
  deleteTodo,
  listLists,
  listTodosForList,
  renameList,
  updateTodo
} from "./store.js";

test("list and todo CRUD flow works end to end", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "todo-server-test-"));
  const databasePath = path.join(tempDirectory, "test.sqlite");
  const database = createDatabase(databasePath);

  try {
    const createdList = createList(database, "Learning backlog");
    assert.equal(createdList.name, "Learning backlog");

    const lists = listLists(database);
    assert.equal(lists.length, 1);

    const renamedList = renameList(database, createdList.id, "Delivery backlog");
    assert.equal(renamedList?.name, "Delivery backlog");

    const createdTodo = createTodo(database, {
      listId: createdList.id,
      title: "Replace prompt-based editing",
      dueDate: "2026-05-03",
      notes: "Keep the state flow obvious."
    });

    assert.ok(createdTodo);
    assert.equal(createdTodo.completed, false);
    assert.equal(createdTodo.dueDate, "2026-05-03");

    const updatedTodo = updateTodo(database, createdTodo.id, {
      title: "Replace prompt-based editing with forms",
      completed: true,
      notes: "Done"
    });

    assert.equal(updatedTodo?.title, "Replace prompt-based editing with forms");
    assert.equal(updatedTodo?.completed, true);

    const todos = listTodosForList(database, createdList.id);
    assert.equal(todos?.length, 1);
    assert.equal(todos?.[0].id, createdTodo.id);

    assert.equal(deleteTodo(database, createdTodo.id), true);
    assert.equal(deleteList(database, createdList.id), true);
  } finally {
    database.close();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("invalid due date is rejected", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "todo-server-test-"));
  const database = createDatabase(path.join(tempDirectory, "test.sqlite"));

  try {
    const createdList = createList(database, "Inbox");

    assert.throws(
      () =>
        createTodo(database, {
          listId: createdList.id,
          title: "Bad date example",
          dueDate: "05/03/2026"
        }),
      /Due date must use YYYY-MM-DD/
    );
  } finally {
    database.close();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("deleting a list also removes its todos", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "todo-server-test-"));
  const database = createDatabase(path.join(tempDirectory, "test.sqlite"));

  try {
    const list = createList(database, "Cascade test");
    const todo = createTodo(database, {
      listId: list.id,
      title: "Should disappear with parent list"
    });

    assert.ok(todo);
    assert.equal(listTodosForList(database, list.id)?.length, 1);

    assert.equal(deleteList(database, list.id), true);
    assert.equal(listTodosForList(database, list.id), null);
    assert.equal(deleteTodo(database, todo.id), false);
  } finally {
    database.close();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});
