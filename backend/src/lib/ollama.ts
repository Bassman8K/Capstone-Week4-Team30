export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

export const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ?? "hermes3:3b";

export interface OllamaSupportRequest {
  childName: string;
  age: number;
  category: string;
  currentSituation: string;
  recentContext?: string;
  knownTriggers?: string[];
  previousStrategies?: string[];
}

export interface OllamaSupportResponse {
  possibleContext: string;
  suggestedActions: string[];
  followUpQuestion: string;
}