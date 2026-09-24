# Hermes Local Adapter Integration

## Purpose

The local Hermes adapter provides the frontend with a stable HTTP endpoint for the Sprint 2 MVP.

Flow:

Frontend → Local Hermes Adapter → Ollama → Hermes 3 → Structured Response

## Requirements

- Node.js 22+
- Ollama installed
- `hermes3:3b` available locally

## Start Ollama

```bash
ollama serve
