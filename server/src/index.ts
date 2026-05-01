import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDatabase, type DatabaseConnection } from "./db.js";
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

export function createApp(database: DatabaseConnection) {
  const app = express();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDistPath = path.resolve(__dirname, "../../client/dist");

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/lists", (_request, response) => {
    response.json(listLists(database));
  });

  app.post("/api/lists", (request, response) => {
    response.status(201).json(createList(database, request.body?.name));
  });

  app.patch("/api/lists/:id", (request, response) => {
    const updated = renameList(database, request.params.id, request.body?.name);
    if (!updated) {
      response.status(404).json({ error: "List not found" });
      return;
    }
    response.json(updated);
  });

  app.delete("/api/lists/:id", (request, response) => {
    if (!deleteList(database, request.params.id)) {
      response.status(404).json({ error: "List not found" });
      return;
    }

    response.json({ success: true });
  });

  app.get("/api/lists/:id/todos", (request, response) => {
    const todos = listTodosForList(database, request.params.id);
    if (!todos) {
      response.status(404).json({ error: "List not found" });
      return;
    }
    response.json(todos);
  });

  app.post("/api/todos", (request, response) => {
    const created = createTodo(database, {
      listId: request.body?.listId,
      title: request.body?.title,
      dueDate: request.body?.dueDate,
      notes: request.body?.notes
    });
    if (!created) {
      response.status(404).json({ error: "List not found" });
      return;
    }
    response.status(201).json(created);
  });

  app.patch("/api/todos/:id", (request, response) => {
    const updated = updateTodo(database, request.params.id, {
      title: request.body?.title,
      completed: request.body?.completed,
      dueDate: request.body?.dueDate,
      notes: request.body?.notes
    });
    if (!updated) {
      response.status(404).json({ error: "Todo not found" });
      return;
    }
    response.json(updated);
  });

  app.delete("/api/todos/:id", (request, response) => {
    if (!deleteTodo(database, request.params.id)) {
      response.status(404).json({ error: "Todo not found" });
      return;
    }

    response.json({ success: true });
  });

  app.use(express.static(clientDistPath));

  app.get("/{*path}", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(path.join(clientDistPath, "index.html"), (error) => {
      if (error) {
        next();
      }
    });
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      response.status(400).json({ error: message });
    }
  );

  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3001);
  const database = createDatabase();
  const app = createApp(database);

  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}
