import { FormEvent, useEffect, useMemo, useState } from "react";

type TodoFilter = "all" | "active" | "completed";

type TodoList = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Todo = {
  id: number;
  listId: number;
  title: string;
  completed: boolean;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type TodoDraft = {
  title: string;
  dueDate: string;
  notes: string;
};

type TodoEditState = {
  id: number;
  title: string;
  dueDate: string;
  notes: string;
};

const emptyDraft: TodoDraft = {
  title: "",
  dueDate: "",
  notes: ""
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Request failed");
  }

  return (await response.json()) as T;
}

export default function App() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [newListName, setNewListName] = useState("");
  const [draft, setDraft] = useState<TodoDraft>(emptyDraft);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingListName, setEditingListName] = useState("");
  const [editingTodo, setEditingTodo] = useState<TodoEditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTodo, setSavingTodo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadLists();
  }, []);

  useEffect(() => {
    if (selectedListId === null) {
      setTodos([]);
      return;
    }

    void loadTodos(selectedListId);
  }, [selectedListId]);

  const visibleTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === "active") {
        return !todo.completed;
      }

      if (filter === "completed") {
        return todo.completed;
      }

      return true;
    });
  }, [filter, todos]);

  async function loadLists() {
    try {
      setLoading(true);
      const data = await request<TodoList[]>("/api/lists");
      setLists(data);
      setSelectedListId((current) => current ?? data[0]?.id ?? null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function loadTodos(listId: number) {
    try {
      const data = await request<Todo[]>(`/api/lists/${listId}/todos`);
      setTodos(data);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    }
  }

  async function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newListName.trim()) {
      return;
    }

    try {
      const created = await request<TodoList>("/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: newListName.trim() })
      });
      setLists((current) => [...current, created]);
      setNewListName("");
      setSelectedListId(created.id);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    }
  }

  function startEditingList(list: TodoList) {
    setEditingListId(list.id);
    setEditingListName(list.name);
  }

  async function handleRenameList(event: FormEvent<HTMLFormElement>, listId: number) {
    event.preventDefault();

    const nextName = editingListName.trim();

    if (!nextName) {
      return;
    }

    try {
      const updated = await request<TodoList>(`/api/lists/${listId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: nextName })
      });
      setLists((existing) =>
        existing.map((list) => (list.id === listId ? updated : list))
      );
      setEditingListId(null);
      setEditingListName("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    }
  }

  async function handleDeleteList(listId: number) {
    const confirmed = window.confirm(
      "Delete this list and all todos inside it?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await request<{ success: true }>(`/api/lists/${listId}`, {
        method: "DELETE"
      });

      const remainingLists = lists.filter((list) => list.id !== listId);
      setLists(remainingLists);
      setSelectedListId(remainingLists[0]?.id ?? null);
      setEditingListId(null);
      setEditingListName("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    }
  }

  async function handleCreateTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedListId === null || !draft.title.trim()) {
      return;
    }

    try {
      setSavingTodo(true);
      const created = await request<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify({
          listId: selectedListId,
          title: draft.title.trim(),
          dueDate: draft.dueDate || null,
          notes: draft.notes.trim() || null
        })
      });
      setTodos((current) => [created, ...current]);
      setDraft(emptyDraft);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    } finally {
      setSavingTodo(false);
    }
  }

  async function handleToggleTodo(todo: Todo) {
    try {
      const updated = await request<Todo>(`/api/todos/${todo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !todo.completed })
      });
      setTodos((current) =>
        current.map((item) => (item.id === todo.id ? updated : item))
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    }
  }

  async function handleDeleteTodo(todoId: number) {
    try {
      await request<{ success: true }>(`/api/todos/${todoId}`, {
        method: "DELETE"
      });
      setTodos((current) => current.filter((todo) => todo.id !== todoId));
      if (editingTodo?.id === todoId) {
        setEditingTodo(null);
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    }
  }

  function startEditingTodo(todo: Todo) {
    setEditingTodo({
      id: todo.id,
      title: todo.title,
      dueDate: todo.dueDate ?? "",
      notes: todo.notes ?? ""
    });
  }

  async function handleSaveTodoEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTodo || !editingTodo.title.trim()) {
      return;
    }

    try {
      const updated = await request<Todo>(`/api/todos/${editingTodo.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editingTodo.title.trim(),
          dueDate: editingTodo.dueDate.trim() || null,
          notes: editingTodo.notes.trim() || null
        })
      });
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setEditingTodo(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getMessage(error));
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">To Do List App</p>
          <h1>Lists</h1>
          <p className="muted">
            This first version keeps the state flow visible on purpose.
          </p>
        </div>

        <form className="stack" onSubmit={handleCreateList}>
          <label className="field">
            <span>New list</span>
            <input
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Weekend errands"
            />
          </label>
          <button type="submit">Create list</button>
        </form>

        <div className="list-panel">
          {lists.map((list) => (
            <div
              key={list.id}
              className={`list-card ${selectedListId === list.id ? "selected" : ""}`}
            >
              {editingListId === list.id ? (
                <form
                  className="stack compact-stack"
                  onSubmit={(event) => void handleRenameList(event, list.id)}
                >
                  <label className="field">
                    <span>List name</span>
                    <input
                      value={editingListName}
                      onChange={(event) => setEditingListName(event.target.value)}
                      autoFocus
                    />
                  </label>
                  <div className="inline-actions">
                    <button type="submit">Save</button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingListId(null);
                        setEditingListName("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    className="list-select"
                    onClick={() => setSelectedListId(list.id)}
                  >
                    {list.name}
                  </button>
                  <div className="list-actions">
                    <button type="button" onClick={() => startEditingList(list)}>
                      Rename
                    </button>
                    <button type="button" onClick={() => handleDeleteList(list.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {!loading && lists.length === 0 ? (
            <p className="empty-message">Create your first list to get started.</p>
          ) : null}
        </div>
      </aside>

      <main className="content">
        <div className="content-header">
          <div>
            <p className="eyebrow">Current list</p>
            <h2>
              {selectedListId === null
                ? "No list selected"
                : lists.find((list) => list.id === selectedListId)?.name}
            </h2>
          </div>

          <div className="filter-row">
            {(["all", "active", "completed"] as TodoFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "active-filter" : ""}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

        <form className="todo-form" onSubmit={handleCreateTodo}>
          <label className="field field-wide">
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Prepare architecture notes"
              disabled={selectedListId === null}
            />
          </label>
          <label className="field">
            <span>Due date</span>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) =>
                setDraft((current) => ({ ...current, dueDate: event.target.value }))
              }
              disabled={selectedListId === null}
            />
          </label>
          <label className="field field-wide">
            <span>Notes</span>
            <textarea
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Plain text only in v1."
              disabled={selectedListId === null}
              rows={3}
            />
          </label>
          <button type="submit" disabled={selectedListId === null || savingTodo}>
            {savingTodo ? "Saving..." : "Add todo"}
          </button>
        </form>

        <section className="todo-list">
          {visibleTodos.map((todo) => (
            <article key={todo.id} className="todo-card">
              {editingTodo?.id === todo.id ? (
                <form className="edit-form" onSubmit={handleSaveTodoEdit}>
                  <label className="field field-wide">
                    <span>Title</span>
                    <input
                      value={editingTodo.title}
                      onChange={(event) =>
                        setEditingTodo((current) =>
                          current ? { ...current, title: event.target.value } : current
                        )
                      }
                      autoFocus
                    />
                  </label>
                  <label className="field">
                    <span>Due date</span>
                    <input
                      type="date"
                      value={editingTodo.dueDate}
                      onChange={(event) =>
                        setEditingTodo((current) =>
                          current ? { ...current, dueDate: event.target.value } : current
                        )
                      }
                    />
                  </label>
                  <label className="field field-wide">
                    <span>Notes</span>
                    <textarea
                      rows={3}
                      value={editingTodo.notes}
                      onChange={(event) =>
                        setEditingTodo((current) =>
                          current ? { ...current, notes: event.target.value } : current
                        )
                      }
                    />
                  </label>
                  <div className="inline-actions">
                    <button type="submit">Save changes</button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setEditingTodo(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="todo-main">
                    <label className="todo-title-row">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo)}
                      />
                      <span className={todo.completed ? "todo-title done" : "todo-title"}>
                        {todo.title}
                      </span>
                    </label>
                    <div className="todo-meta">
                      <span>{todo.dueDate ? `Due ${todo.dueDate}` : "No due date"}</span>
                      <span>{todo.notes ? todo.notes : "No notes"}</span>
                    </div>
                  </div>
                  <div className="todo-actions">
                    <button type="button" onClick={() => startEditingTodo(todo)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteTodo(todo.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}

          {!loading && selectedListId !== null && visibleTodos.length === 0 ? (
            <p className="empty-message">No todos match the current filter.</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}
