# AI Workflow Notes

## Purpose

This file captures the AI-assisted development patterns used during the
project, when they helped, and when they added noise.

## Current Approach

### Spec-first workflow

We locked scope before writing code. The reason is simple: vague scope causes
the AI to generate plausible but misaligned architecture and features.

### Staged complexity

We will build the core UI with plain React patterns first, then refactor only
after the limitations are visible. This avoids learning abstractions before the
underlying problems are understood.

### Decision logging

We will record non-obvious technical choices in ADRs instead of relying on
memory or chat history. This keeps the repo legible to a third party.

## Prompts That Helped

- Ask for milestone-level planning before implementation.
- Narrow scope by explicitly naming non-goals.
- Prefer "justify the simpler alternative" when considering a new library.

## Failure Modes To Watch

- Expanding scope by treating every idea as a requirement
- Adding production patterns before the simple version is understood
- Letting the AI write too much code without pausing to explain the decisions
- Confusing backend/platform complexity with React learning

## Review Checkpoints

- After project setup
- After the local-state React version works
- After persistence is added
- Before introducing any major new library

## Notes To Update Later

- Which prompts produced the clearest code explanations
- Which abstractions felt worth the cost
- Where a better prompt would have saved time
