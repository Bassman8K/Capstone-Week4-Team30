import { askHermes } from '../lib/hermesClient'
import type { HermesContext, HermesRequest } from '../lib/ollama'

interface Scenario {
  name: string
  appRequest: HermesContext
}

const scenarios: Scenario[] = [
  {
    name: 'Sensory overload - shopping centre',
    appRequest: {
      childName: 'Sam',
      age: 7,
      category: 'Sensory',
      currentSituation:
        'Sam is becoming overwhelmed by loud noises in a shopping centre.',
      recentContext: 'Sam slept poorly last night.',
      knownTriggers: ['Loud environments'],
      previousStrategies: ['Noise-cancelling headphones'],
    },
  },
  {
    name: 'Bedtime routine change',
    appRequest: {
      childName: 'Sam',
      age: 7,
      category: 'Routine',
      currentSituation:
        'Sam becomes upset when his normal bedtime routine changes.',
      recentContext: 'The family has visitors staying over tonight.',
      knownTriggers: ['Unexpected routine changes'],
      previousStrategies: ['Visual schedule'],
    },
  },
  {
    name: 'Transition to school',
    appRequest: {
      childName: 'Sam',
      age: 7,
      category: 'Transition',
      currentSituation:
        'Sam becomes distressed when asked to stop playing and get ready for school.',
      recentContext: 'Sam is very focused on his favourite game.',
      knownTriggers: ['Stopping preferred activities', 'Unexpected transitions'],
      previousStrategies: ['Five-minute warning', 'Visual timer'],
    },
  },
  {
    name: 'Communication frustration',
    appRequest: {
      childName: 'Sam',
      age: 7,
      category: 'Communication',
      currentSituation:
        'Sam is becoming frustrated because his parent cannot understand what he is asking for.',
      recentContext: 'Sam has tried asking several times.',
      knownTriggers: ['Being misunderstood'],
      previousStrategies: ['Pictures', 'Giving extra time to communicate'],
    },
  },
  {
    name: 'Crowded supermarket',
    appRequest: {
      childName: 'Sam',
      age: 7,
      category: 'Sensory',
      currentSituation:
        'Sam is becoming overwhelmed because the supermarket is crowded and noisy.',
      recentContext: 'Sam has already spent an hour outside the house today.',
      knownTriggers: ['Crowds', 'Loud environments'],
      previousStrategies: ['Noise-cancelling headphones', 'Short breaks'],
    },
  },
]

async function main() {
  for (const scenario of scenarios) {
    console.info(`\n=== ${scenario.name} ===`)

    // Same mapping performed by POST /api/hermes.
    const request: HermesRequest = {
      context: scenario.appRequest,
      userMessage: scenario.appRequest.currentSituation,
    }

    const startTime = Date.now()
    const response = await askHermes(request)
    const responseTime = (Date.now() - startTime) / 1000

    console.info(`Response time: ${responseTime.toFixed(3)}s`)
    console.info(`Suggested actions returned: ${response.suggestedActions.length}`)
    console.info(JSON.stringify(response, null, 2))
  }
}

main().catch((error) => {
  console.error('Hermes scenario testing failed:', error)
  process.exit(1)
})