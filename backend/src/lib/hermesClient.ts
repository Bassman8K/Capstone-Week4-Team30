import { z } from 'zod'
import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  type HermesRequest,
  type HermesResponse,
} from './ollama'
import { HERMES_SYSTEM_PROMPT } from './hermesPrompt'

interface OllamaChatResponse {
  message: {
    content: string
  }
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const hermesResponseSchema = z.object({
  possibleContext: z.string().trim().min(1),
  suggestedActions: z
    .array(z.string().trim().min(1))
    .max(3),
  followUpQuestion: z.string().trim().min(1),
  safetyNotice: z.string().nullable().optional(),
})

const hermesResponseFormat = {
  type: 'object',
  properties: {
    possibleContext: {
      type: 'string',
    },
    suggestedActions: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 0,
      maxItems: 3,
    },
    followUpQuestion: {
      type: 'string',
    },
    safetyNotice: {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'null',
        },
      ],
    },
  },
  required: [
    'possibleContext',
    'suggestedActions',
    'followUpQuestion',
  ],
  additionalProperties: false,
} as const

function buildContextSummary(request: HermesRequest): string {
  const {
    recentContext,
    knownTriggers,
    previousStrategies,
  } = request.context

  const parts: string[] = []

  if (recentContext?.trim()) {
    parts.push(`Recent context: ${recentContext.trim()}`)
  }

  if (knownTriggers?.length) {
    parts.push(
      `Known triggers: ${knownTriggers.join(', ')}.`,
    )
  }

  if (previousStrategies?.length) {
    parts.push(
      `Previously tried strategies: ${previousStrategies.join(
        ', ',
      )}. Their effectiveness is not assumed.`,
    )
  }

  if (parts.length === 0) {
    return 'No additional context provided.'
  }

  return parts.join(' ')
}

function needsMoreContext(request: HermesRequest): boolean {
  const {
    currentSituation,
    recentContext,
  } = request.context

  const normalizedSituation = currentSituation
    .trim()
    .toLowerCase()

  const vagueSituations = [
    'is upset',
    'seems upset',
    'is struggling',
    'is having a hard time',
    'i do not know what to do',
    "i don't know what to do",
    'please help',
  ]

  const isVague = vagueSituations.some((phrase) =>
    normalizedSituation.includes(phrase),
  )

  const detailIndicators = [
    ' because ',
    ' after ',
    ' when ',
    ' since ',
    ' during ',
    ' before ',
  ]

  const hasImmediateDetail =
    Boolean(recentContext?.trim()) ||
    detailIndicators.some((indicator) =>
      normalizedSituation.includes(indicator),
    )

  return isVague && !hasImmediateDetail
}

function isUrgentMedicalSituation(
  request: HermesRequest,
): boolean {
  const text = [
    request.context.currentSituation,
    request.context.recentContext ?? '',
    request.userMessage,
  ]
    .join(' ')
    .toLowerCase()

  const urgentPhrases = [
    'difficulty breathing',
    'trouble breathing',
    'cannot breathe',
    "can't breathe",
    'lips are swelling',
    'lip swelling',
    'face is swelling',
    'facial swelling',
    'unconscious',
    'seizure',
  ]

  return urgentPhrases.some((phrase) =>
    text.includes(phrase),
  )
}

function isDiagnosisRequest(
  request: HermesRequest,
): boolean {
  const text = [
    request.context.currentSituation,
    request.userMessage,
  ]
    .join(' ')
    .toLowerCase()

  const diagnosisPhrases = [
    'does this mean',
    'does he have',
    'does she have',
    'do they have',
    'is this adhd',
    'is this autism',
    'diagnose',
    'diagnosis',
  ]

  const conditionTerms = [
    'adhd',
    'autism',
    'autistic',
    'condition',
    'disorder',
  ]

  const asksForDiagnosis = diagnosisPhrases.some(
    (phrase) => text.includes(phrase),
  )

  const mentionsCondition = conditionTerms.some(
    (term) => text.includes(term),
  )

  return asksForDiagnosis && mentionsCondition
}

function isDietPlanningRequest(
  request: HermesRequest,
): boolean {
  const text = [
    request.context.currentSituation,
    request.userMessage,
  ]
    .join(' ')
    .toLowerCase()

  const dietPhrases = [
    'generate a diet',
    'create a diet',
    'make a diet',
    'diet plan',
    'meal plan',
    'create a meal plan',
    'generate a meal plan',
    'what should my child eat',
    'diet suitable for my child',
    'diet that can be suitable',
  ]

  return dietPhrases.some((phrase) =>
    text.includes(phrase),
  )
}

function isNeutralObservation(
  request: HermesRequest,
): boolean {
  const text = request.context.currentSituation
    .trim()
    .toLowerCase()

  const requestIndicators = [
    '?',
    'what should',
    'what can',
    'what do',
    'how should',
    'how can',
    'can you',
    'could you',
    'help me',
    'please help',
    'advice',
    'suggest',
    'recommend',
    'generate',
    'create',
  ]

  const concernIndicators = [
    'upset',
    'refus',
    'overwhelm',
    'distress',
    'struggl',
    'meltdown',
    'crying',
    'angry',
    'anxious',
    'scared',
    'worried',
    "won't",
    'will not',
    'cannot',
    "can't",
    'difficulty',
    'trouble',
    'pain',
    'hurt',
    'swelling',
    'allergy',
    'unsafe',
    'problem',
    'issue',
  ]

  const observationIndicators = [
    ' ate ',
    'ate ',
    ' eating ',
    'eating ',
    ' drank ',
    'drank ',
    ' slept ',
    'slept ',
    ' played ',
    'played ',
    ' tried ',
    'tried ',
    'today',
    'yesterday',
  ]

  const asksForHelp = requestIndicators.some(
    (indicator) => text.includes(indicator),
  )

  const describesConcern = concernIndicators.some(
    (indicator) => text.includes(indicator),
  )

  const looksLikeObservation = observationIndicators.some(
    (indicator) => text.includes(indicator),
  )

  return (
    looksLikeObservation &&
    !asksForHelp &&
    !describesConcern
  )
}

function findConflictingChildName(
  request: HermesRequest,
): string | null {
  const activeChildName =
    request.context.childName.trim()

  const text =
    request.context.currentSituation.trim()

  const ignoredWords = new Set([
    'What',
    'When',
    'Where',
    'Why',
    'How',
    'Who',
    'Please',
    'Today',
    'Yesterday',
    'Tomorrow',
  ])

  const childMentionPattern =
    /\b([A-Z][A-Za-z'-]{1,30})\s+(?:is|was|has|had|does|did|refused|ate|eats|becomes|became|seems|started|starts)\b/g

  for (const match of text.matchAll(childMentionPattern)) {
    const mentionedName = match[1]

    if (!mentionedName) {
      continue
    }

    if (ignoredWords.has(mentionedName)) {
      continue
    }

    if (
      mentionedName.toLowerCase() !==
      activeChildName.toLowerCase()
    ) {
      return mentionedName
    }
  }

  return null
}

export async function askHermes(
  request: HermesRequest,
): Promise<HermesResponse> {
  const childName = request.context.childName

  // Emergency cases take priority over all other checks.
  if (isUrgentMedicalSituation(request)) {
    return {
      possibleContext: buildContextSummary(request),
      suggestedActions: [
        'Seek urgent emergency medical help now.',
        `Stay with ${childName} while waiting for professional emergency help.`,
      ],
      followUpQuestion:
        'Are emergency services being contacted now?',
      safetyNotice:
        'This may be a medical emergency. This assistant cannot provide diagnosis, medication, or treatment instructions.',
    }
  }

  // Do not combine the active profile with another child's message.
  const conflictingChildName =
    findConflictingChildName(request)

  if (conflictingChildName) {
    return {
      possibleContext:
        `The active child profile is ${childName}, but the current message refers to ${conflictingChildName}.`,
      suggestedActions: [],
      followUpQuestion:
        `Should I use ${childName}'s profile, or are you asking about ${conflictingChildName}?`,
      safetyNotice: null,
    }
  }

  // Prevent diagnostic conclusions.
  if (isDiagnosisRequest(request)) {
    return {
      possibleContext: buildContextSummary(request),
      suggestedActions: [
        'Avoid drawing a diagnosis from these behaviours alone.',
        `If you are concerned, discuss the pattern with a qualified health professional who can assess ${childName} in context.`,
      ],
      followUpQuestion:
        'In what situations do these behaviours usually occur?',
      safetyNotice:
        'This assistant cannot diagnose ADHD, autism, or other medical or mental health conditions.',
    }
  }

  // Do not create a personalised diet without enough information.
  if (isDietPlanningRequest(request)) {
    return {
      possibleContext: buildContextSummary(request),
      suggestedActions: [],
      followUpQuestion:
        `What foods does ${childName} currently eat comfortably, and are there any allergies or dietary restrictions I should know about?`,
      safetyNotice:
        'I can help with practical mealtime support, but I cannot prescribe a personalised diet or replace advice from a qualified health or nutrition professional.',
    }
  }

  // A neutral observation is not automatically a request for advice.
  // Ask what the caregiver wants help with instead of inventing a problem.
  if (isNeutralObservation(request)) {
    return {
      possibleContext: buildContextSummary(request),
      suggestedActions: [],
      followUpQuestion:
        `What would you like help with about ${childName}'s situation—for example, food refusal, trying new foods, or meal planning?`,
      safetyNotice: null,
    }
  }

  // A vague situation needs immediate context before advice.
  if (needsMoreContext(request)) {
    return {
      possibleContext: buildContextSummary(request),
      suggestedActions: [],
      followUpQuestion:
        `What happened just before this started, and what is ${childName} doing right now?`,
      safetyNotice: null,
    }
  }

  const messages: OllamaMessage[] = [
    {
      role: 'system',
      content: HERMES_SYSTEM_PROMPT,
    },
  ]

  if (request.sessionContext?.length) {
    messages.push(
      ...request.sessionContext.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    )
  }

  const {
    age,
    category,
    currentSituation,
    recentContext,
    knownTriggers,
    previousStrategies,
  } = request.context

  const contextMessage = `
CURRENT REQUEST

Child name: ${childName}
Age: ${age}
Category: ${category}

CURRENT SITUATION:
${currentSituation}

RECENT CONTEXT:
${recentContext ?? 'Not provided'}

KNOWN TRIGGERS:
${knownTriggers?.length ? knownTriggers.join(', ') : 'Not provided'}

PREVIOUS STRATEGIES:
${
  previousStrategies?.length
    ? `${previousStrategies.join(', ')}

These strategies have ALREADY been tried.
Do NOT present any of these strategies as new advice.
If you mention one again, explicitly say it was previously tried and explain how it could be adapted.
At least one suggested action MUST be different from all previous strategies.
Their effectiveness is unknown unless explicitly stated.`
    : 'Not provided'
}

CURRENT USER MESSAGE:
${request.userMessage}

Important:
- CURRENT SITUATION and RECENT CONTEXT are separate facts.
- The active child profile belongs to ${childName}.
- Do not combine this profile with information about another child.
- Do not change when or where an event happened.
- PREVIOUS STRATEGIES have already been tried.
- Do not present previous strategies as completely new.
- Do not claim a previous strategy worked unless explicitly stated.
- Do not ask for information already listed above.
- Do not repeat or restate the caregiver's current question in possibleContext.
- Do not infer distress, anxiety, refusal, sensory difficulty, or another problem unless the caregiver actually described it.
- A neutral observation is not evidence that something is wrong.
- If important context is missing and advice would require guessing, return no suggested actions.
- For missing-context requests, return "suggestedActions": [].
- Ask one clear follow-up question for the most useful missing detail.
- Do not give generic advice simply to fill the suggestedActions array.
`

  messages.push({
    role: 'user',
    content: contextMessage,
  })

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: hermesResponseFormat,
      messages,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: ${response.status}`,
    )
  }

  const data =
    (await response.json()) as OllamaChatResponse

  const parsedJson: unknown =
    JSON.parse(data.message.content)

  const validated =
    hermesResponseSchema.parse(parsedJson)

  return {
    possibleContext: buildContextSummary(request),
    suggestedActions: validated.suggestedActions,
    followUpQuestion: validated.followUpQuestion,
    safetyNotice: validated.safetyNotice ?? null,
  }
}