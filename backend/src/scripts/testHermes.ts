import { askHermes } from "../lib/hermesClient";
import type { HermesRequest } from "../lib/ollama";

const request: HermesRequest = {
  context: {
    childName: "Sam",
    age: 7,
    category: "Sensory",
    currentSituation:
      "Sam is becoming overwhelmed because the supermarket is crowded and noisy.",
    recentContext: "Sam has already spent an hour outside the house today.",
    knownTriggers: ["Crowds", "Loud environments"],
    previousStrategies: ["Noise-cancelling headphones", "Short breaks"],
  },
  userMessage:
    "What can I do to support Sam while we are in the supermarket?",
};

async function main() {
  console.info("Sending request to Hermes...");

  const startTime = Date.now();

  const response = await askHermes(request);

  const responseTime = (Date.now() - startTime) / 1000;

  console.info(`Hermes response time: ${responseTime.toFixed(3)}s`);
  console.info(JSON.stringify(response, null, 2));
}

main().catch((error) => {
  console.error("Hermes test failed:", error);
  process.exit(1);
});