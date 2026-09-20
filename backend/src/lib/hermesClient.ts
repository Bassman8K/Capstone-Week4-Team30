import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  type HermesRequest,
  type HermesResponse,
} from "./ollama";

import { HERMES_SYSTEM_PROMPT } from "./hermesPrompt";

interface OllamaChatResponse {
  message: {
    content: string;
  };
}

export async function askHermes(
  request: HermesRequest,
): Promise<HermesResponse> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      messages: [
        {
          role: "system",
          content: HERMES_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify(request),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = (await response.json()) as OllamaChatResponse;

  return JSON.parse(data.message.content) as HermesResponse;
}