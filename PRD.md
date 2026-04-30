# Product Requirements Document

## Project

To Do List App

## Goal

Build a portfolio-quality full-stack web app that helps a single user manage
multiple to do lists. The app should also serve as a learning project for
React, TypeScript, and AI-assisted development.

## Problem

The user needs a simple way to organize tasks across multiple lists, track due
dates, and store lightweight notes without introducing collaboration or other
advanced workflow features.

## Target User

A single authenticated identity is not required in v1. The primary user is the
project owner running the app for personal task management and learning.

## In Scope

- Create, rename, and delete lists
- View all lists on the main interface
- Create, edit, complete, and delete todos
- Assign each todo to a list
- Add an optional due date to a todo
- Add optional plain-text notes to a todo
- Filter todos by `all`, `active`, and `completed`
- Persist data in a database
- Deploy the app with a public URL
- Document architecture and AI workflow decisions in the repo

## Out of Scope

- Authentication
- Sharing or collaboration
- Public links
- Attachments
- Notifications or reminders
- Rich text notes
- Recurring tasks
- Tags, priorities, or subtasks
- Offline support

## User Stories

- As a user, I want to create multiple lists so I can separate work by context.
- As a user, I want to add a todo with a title so I can track a task.
- As a user, I want to mark a todo completed so I can see progress.
- As a user, I want to edit or delete a todo so I can keep my lists accurate.
- As a user, I want to add a due date so I can see when a task is time-bound.
- As a user, I want to add notes so I can keep supporting details with a task.
- As a user, I want to filter by active or completed tasks so I can focus on
  the tasks that matter in the moment.

## Functional Requirements

- The app must support multiple lists.
- Each todo must belong to exactly one list.
- A todo must have a title and completion status.
- A todo may have a due date.
- A todo may have plain-text notes.
- The UI must allow filtering by `all`, `active`, and `completed`.
- Data must persist across page reloads.

## Non-Functional Requirements

- The codebase should favor clarity over abstraction in the first iteration.
- The frontend should use React and TypeScript.
- The app should be simple to run locally from the README.
- The app should include a basic automated test suite for critical paths.
- Documentation should be concise and interview-readable.

## Success Criteria

- A user can manage multiple lists and todos without losing data.
- Core CRUD flows work reliably for lists and todos.
- Filtering works correctly.
- The app is deployed and runnable by a stranger using the README.
- The repo shows intentional architecture and workflow decisions.
