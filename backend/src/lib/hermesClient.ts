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

function buildContextSummary(
  request: HermesRequest,
): string {
  const {
    recentContext,
    knownTriggers,
    previousStrategies,
  } = request.context

  const parts: string[] = []

  if (recentContext?.trim()) {
    parts.push(
      `Recent context: ${recentContext.trim()}`,
    )
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

function needsMoreContext(
  request: HermesRequest,
): boolean {
  const {
    currentSituation,
    recentContext,
  } = request.context

  const normalizedSituation = currentSituation
    .trim()
    .toLowerCase()

  const normalizedRecentContext = ` ${(recentContext ?? '')
    .trim()
    .toLowerCase()} `

  const vagueSituations = [
    'is upset',
    'seems upset',
    'is struggling',
    'is having a hard time',
    'i do not know what to do',
    "i don't know what to do",
    'please help',
  ]

  const isVague = vagueSituations.some(
    (phrase) =>
      normalizedSituation.includes(phrase),
  )

  const detailIndicators = [
    ' because ',
    ' after ',
    ' when ',
    ' since ',
    ' during ',
    ' before ',
    ' started ',
    ' happened ',
  ]

  const hasSituationDetail =
    detailIndicators.some((indicator) =>
      ` ${normalizedSituation} `.includes(
        indicator,
      ),
    )

  const hasSpecificRecentDetail =
    detailIndicators.some((indicator) =>
      normalizedRecentContext.includes(
        indicator,
      ),
    )

  const hasImmediateDetail =
    hasSituationDetail ||
    hasSpecificRecentDetail

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

  const childName = request.context.childName
    .trim()
    .toLowerCase()

  const diagnosisPhrases = [
    'does this mean',
    'does he have',
    'does she have',
    'do they have',
    `does ${childName} have`,
    `is ${childName} `,
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

  const asksForDiagnosis =
    diagnosisPhrases.some((phrase) =>
      text.includes(phrase),
    )

  const mentionsCondition =
    conditionTerms.some((term) =>
      text.includes(term),
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

function getUserProvidedText(
  request: HermesRequest,
): string {
  return [
    request.context.currentSituation,
    request.context.recentContext ?? '',
    request.userMessage,
    ...(request.sessionContext ?? [])
      .filter(
        (message) =>
          message.role === 'user',
      )
      .map(
        (message) =>
          message.content,
      ),
  ]
    .join(' ')
    .toLowerCase()
}

function getExplicitAllergens(
  request: HermesRequest,
): string[] {
  const text =
    getUserProvidedText(request)

  const allergens = new Set<string>()

  const allergyPatterns = [
    /\b(peanut|peanuts)\s+allergy\b/g,
    /\ballergic\s+to\s+(peanut|peanuts)\b/g,
    /\bcannot\s+eat\s+(peanut|peanuts)\b/g,
    /\bcan't\s+eat\s+(peanut|peanuts)\b/g,
  ]

  for (const pattern of allergyPatterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) {
        allergens.add(match[1])
      }
    }
  }

  if (
    allergens.has('peanut') ||
    allergens.has('peanuts')
  ) {
    allergens.add('peanut')
    allergens.add('peanuts')
    allergens.add('peanut butter')
  }

  return [...allergens]
}

function removeAllergenSuggestions(
  actions: string[],
  request: HermesRequest,
): string[] {
  const allergens =
    getExplicitAllergens(request)

  if (allergens.length === 0) {
    return actions
  }

  return actions.filter((action) => {
    const text = action.toLowerCase()

    return !allergens.some((allergen) =>
      text.includes(allergen),
    )
  })
}

function mentionsAllergy(
  request: HermesRequest,
): boolean {
  const text =
    getUserProvidedText(request)

  return [
    'allergy',
    'allergic',
    'allergies',
  ].some((term) =>
    text.includes(term),
  )
}

function removeUnverifiedAllergyClaims(
  actions: string[],
  request: HermesRequest,
): string[] {
  if (mentionsAllergy(request)) {
    return actions
  }

  return actions.filter(
    (action) =>
      !/\ballerg(?:y|ies|ic|en|ens)\b/i.test(
        action,
      ),
  )
}

function getPreviouslySuccessfulSubstitute(
  request: HermesRequest,
): string | null {
  const userMessages = [
    ...(request.sessionContext ?? [])
      .filter(
        (message) =>
          message.role === 'user',
      )
      .map((message) =>
        message.content.trim(),
      ),
    request.context.currentSituation.trim(),
  ]
    .filter(Boolean)
    .reverse()

  for (const message of userMessages) {
    const butMatch = message.match(
      /\bbut\s+([^,.!?]{1,60}?)\s+worked\s+instead\b/i,
    )

    if (butMatch?.[1]) {
      return butMatch[1].trim()
    }

    const directMatch = message.match(
      /^([^,.!?]{1,60}?)\s+worked\s+instead\b/i,
    )

    if (directMatch?.[1]) {
      return directMatch[1].trim()
    }
  }

  return null
}

function removeUnverifiedSafeClaims(
  actions: string[],
  request: HermesRequest,
): string[] {
  if (!mentionsAllergy(request)) {
    return actions
  }

  return actions.filter(
    (action) =>
      !/\bsafe\b/i.test(action),
  )
}

function ensurePreviousSuccessfulSubstitute(
  actions: string[],
  request: HermesRequest,
): string[] {
  const substitute =
    getPreviouslySuccessfulSubstitute(request)

  if (!substitute) {
    return actions
  }

  const normalizedSubstitute =
    substitute.toLowerCase()

  const alreadyRecognised =
    actions.some((action) => {
      const text = action.toLowerCase()

      return (
        text.includes(normalizedSubstitute) &&
        (
          text.includes('worked') ||
          text.includes('previously') ||
          text.includes('successful')
        )
      )
    })

  if (alreadyRecognised) {
    return actions
  }

  const remainingActions =
    actions.filter(
      (action) =>
        !action
          .toLowerCase()
          .includes(normalizedSubstitute),
    )

  return [
    `Since ${substitute} worked previously, you could offer ${substitute} again if it still fits ${request.context.childName}'s current dietary needs.`,
    ...remainingActions.slice(0, 1),
  ]
}

const ALLERGY_LABEL_REMINDER =
  'Check ingredient and allergen labels before offering packaged or prepared foods, and avoid products containing the stated allergen or relevant cross-contact warnings.'

function ensureAllergyLabelReminder(
  actions: string[],
  request: HermesRequest,
): string[] {
  if (!mentionsAllergy(request)) {
    return actions
  }

  const alreadyIncludesReminder =
    actions.some((action) => {
      const text = action.toLowerCase()

      const mentionsLabels =
        text.includes('label') ||
        text.includes('ingredient') ||
        text.includes('allergen')

      const tellsCaregiverToCheck =
        text.includes('check') ||
        text.includes('read')

      return (
        mentionsLabels &&
        tellsCaregiverToCheck
      )
    })

  if (alreadyIncludesReminder) {
    return actions
  }

  return [
    ...actions.slice(0, 2),
    ALLERGY_LABEL_REMINDER,
  ]
}

function isNeutralObservation(
  request: HermesRequest,
): boolean {
  const text = request.context.currentSituation
    .trim()
    .toLowerCase()
    .replace(/[‘’]/g, "'")

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
    "isn't",
    'is not',
    "doesn't",
    'does not',
    "didn't",
    'did not',
    "don't know",
    'skipp',
  ]

  const observationIndicators = [
    ' ate ',
    'ate ',
    ' eats ',
    'eats ',
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
    'usually eats',
    'normally eats',
    'typically eats',
    'today',
    'yesterday',
  ]

  const asksForHelp =
    requestIndicators.some((indicator) =>
      text.includes(indicator),
    )

  const describesConcern =
    concernIndicators.some((indicator) =>
      text.includes(indicator),
    )

  const looksLikeObservation =
    observationIndicators.some((indicator) =>
      text.includes(indicator),
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

  for (
    const match of text.matchAll(
      childMentionPattern,
    )
  ) {
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

function isUnclearFollowUp(
  request: HermesRequest,
): boolean {
  const text = request.context.currentSituation
    .trim()
    .toLowerCase()
    .replace(/[?.!]+$/, '')

  const followUpPhrases = [
    'what else could i try',
    'what else can i try',
    'what else should i try',
    'what should i try next',
    'what should i try instead',
    'what can i try instead',
    'what should i do next',
    'anything else i can try',
    'any other ideas',
    'anything else',
    'what about something different',
    'what else',
  ]

  return followUpPhrases.some(
    (phrase) =>
      text === phrase ||
      text.startsWith(`${phrase} `),
  )
}

function getRecentUserConversationFocus(
  request: HermesRequest,
): string | null {
  const userMessages = (
    request.sessionContext ?? []
  )
    .filter(
      (message) =>
        message.role === 'user',
    )
    .map((message) =>
      message.content.trim(),
    )
    .filter(Boolean)
    .slice(-2)

  if (userMessages.length === 0) {
    return null
  }

  if (userMessages.length === 1) {
    return `LATEST USER CONTEXT:
${userMessages[0]}`
  }

  const earlierMessage =
    userMessages[0]

  const latestMessage =
    userMessages[1]

  return `EARLIER USER CONTEXT:
${earlierMessage}

LATEST USER UPDATE:
${latestMessage}

If these statements conflict, the LATEST USER UPDATE is the controlling current fact.
Do not recommend something based on the earlier statement when the latest update contradicts it.`
}

const COMMON_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'you',
  'your',
  'him',
  'his',
  'her',
  'their',
  'they',
  'them',
  'can',
  'could',
  'would',
  'should',
  'try',
  'trying',
  'offer',
  'offering',
  'help',
  'also',
  'more',
  'some',
  'have',
  'has',
  'been',
  'into',
  'from',
  'when',
  'while',
  'about',
  'ben',
])

function meaningfulWords(
  text: string,
): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(
        (word) =>
          word.length >= 4 &&
          !COMMON_WORDS.has(word),
      ),
  )
}

function isSubstantiallyRepeated(
  candidate: string,
  previousText: string,
): boolean {
  const candidateWords =
    meaningfulWords(candidate)

  const previousWords =
    meaningfulWords(previousText)

  if (
    candidateWords.size === 0 ||
    previousWords.size === 0
  ) {
    return false
  }

  let overlap = 0

  for (const word of candidateWords) {
    if (previousWords.has(word)) {
      overlap += 1
    }
  }

  return (
    overlap / candidateWords.size >= 0.6
  )
}

const STRATEGY_GENERIC_WORDS = new Set([
  'using',
  'giving',
  'short',
  'extra',
  'five',
  'minute',
  'minutes',
])

function strategyWords(
  text: string,
): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        if (
          word.endsWith('ies') &&
          word.length > 4
        ) {
          return `${word.slice(0, -3)}y`
        }

        if (
          word.endsWith('s') &&
          word.length > 4 &&
          !word.endsWith('ss')
        ) {
          return word.slice(0, -1)
        }

        return word
      })
      .filter(
        (word) =>
          word.length >= 4 &&
          !STRATEGY_GENERIC_WORDS.has(word),
      ),
  )
}

function repeatsPreviousStrategy(
  action: string,
  strategy: string,
): boolean {
  const actionWords =
    strategyWords(action)

  const strategyKeyWords =
    strategyWords(strategy)

  if (strategyKeyWords.size === 0) {
    return false
  }

  let overlap = 0

  for (const word of strategyKeyWords) {
    if (actionWords.has(word)) {
      overlap += 1
    }
  }

  if (strategyKeyWords.size === 1) {
    return overlap === 1
  }

  return (
    overlap / strategyKeyWords.size >= 0.5
  )
}

const GENERIC_REFUSAL_ITEMS =
  new Set([
    'food',
    'foods',
    'meal',
    'meals',
    'snack',
    'snacks',
    'breakfast',
    'lunch',
    'dinner',
  ])

function getExplicitlyRefusedFoods(
  request: HermesRequest,
): string[] {
  const userMessages = [
    ...(request.sessionContext ?? [])
      .filter(
        (message) =>
          message.role === 'user',
      )
      .map(
        (message) =>
          message.content,
      ),
    request.context.currentSituation,
    request.userMessage,
  ]

  const refusedFoods =
    new Set<string>()

  const refusalPattern =
    /\brefused\s+(?:(?:his|her|their)\s+)?(?:usual\s+)?([a-z][a-z -]{1,40}?)(?=\s+(?:today|yesterday|tonight|this morning|this afternoon|this evening)\b|[,.!?]|$)/gi

  for (const message of userMessages) {
    for (
      const match of message.matchAll(
        refusalPattern,
      )
    ) {
      const food = match[1]
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')

      if (
        food &&
        !GENERIC_REFUSAL_ITEMS.has(food)
      ) {
        refusedFoods.add(food)
      }
    }
  }

  return [...refusedFoods]
}

function removeRefusedFoodSuggestions(
  actions: string[],
  request: HermesRequest,
): string[] {
  const refusedFoods =
    getExplicitlyRefusedFoods(request)

  if (refusedFoods.length === 0) {
    return actions
  }

  const recommendationPattern =
    /\b(offer|offering|try|trying|serve|serving|prepare|preparing|give|giving|make|making|introduce|introducing|consider)\b/i

return actions.filter((action) => {
  const text = action.toLowerCase()

  const genericRetryPattern =
    /\b(the meal|the food|same meal|same food|offer it again|offer again|try it again|try again|retry|smaller pieces)\b/i

  if (
    refusedFoods.length > 0 &&
    genericRetryPattern.test(text)
  ) {
    return false
  }

  return !refusedFoods.some(
    (food) => {
      if (!text.includes(food)) {
        return false
      }

      const avoidancePhrases = [
        `avoid ${food}`,
        `without ${food}`,
        `${food}-free`,
        `instead of ${food}`,
        `rather than ${food}`,
        `alternative to ${food}`,
      ]

      const isAvoidanceAdvice =
        avoidancePhrases.some(
          (phrase) =>
            text.includes(phrase),
        )

      if (isAvoidanceAdvice) {
        return false
      }

      return recommendationPattern.test(
        text,
      )
    },
  )
})
}
function sanitizeFollowUpQuestion(
  question: string,
  request: HermesRequest,
): string {
  const refusedFoods =
    getExplicitlyRefusedFoods(request)

  const normalizedQuestion =
    question.toLowerCase()

  const retryIndicators =
    /\b(try|trying|retry|again|encourage|offer|offering|serve|serving|prepare|preparing|reintroduce|reintroducing|taste|tasting)\b/i

  const refusedFoodMentioned =
    refusedFoods.some((food) =>
      normalizedQuestion.includes(food),
    )

  if (
    refusedFoodMentioned &&
    retryIndicators.test(question)
  ) {
    return `What other foods is ${request.context.childName} willing to eat today instead?`
  }

  if (
    !mentionsAllergy(request) &&
    /\ballerg(?:y|ies|ic|en|ens)\b/i.test(question)
  ) {
    return `What other foods is ${request.context.childName} willing to eat today?`
  }

  return question
}

function removeUnadaptedPreviousStrategies(
  actions: string[],
  request: HermesRequest,
): string[] {
  const previousStrategies =
    request.context.previousStrategies ?? []

  if (previousStrategies.length === 0) {
    return actions
  }

  const adaptationIndicators = [
    'previously tried',
    'already tried',
    'tried before',
    'adapt',
    'adapted',
    'adjust',
    'adjusted',
    'modify',
    'modified',
  ]

  return actions.filter((action) => {
    const repeatsPrevious =
      previousStrategies.some((strategy) =>
        repeatsPreviousStrategy(
          action,
          strategy,
        ),
      )

    if (!repeatsPrevious) {
      return true
    }

    const normalizedAction =
      action.toLowerCase()

    return adaptationIndicators.some(
      (indicator) =>
        normalizedAction.includes(indicator),
    )
  })
}

function removeRepeatedActions(
  actions: string[],
  request: HermesRequest,
): string[] {
  const previousAssistantMessages = (
    request.sessionContext ?? []
  )
    .filter(
      (message) =>
        message.role === 'assistant',
    )
    .map((message) =>
      message.content.trim(),
    )
    .filter(Boolean)

  const accepted: string[] = []

  for (const action of actions) {
    const repeatedFromHistory =
      previousAssistantMessages.some(
        (previousMessage) =>
          isSubstantiallyRepeated(
            action,
            previousMessage,
          ),
      )

    const repeatedInCurrentReply =
      accepted.some(
        (existingAction) =>
          isSubstantiallyRepeated(
            action,
            existingAction,
          ) ||
          isSubstantiallyRepeated(
            existingAction,
            action,
          ),
      )

    if (
      !repeatedFromHistory &&
      !repeatedInCurrentReply
    ) {
      accepted.push(action)
    }
  }

  return accepted
}

export async function askHermes(
  request: HermesRequest,
): Promise<HermesResponse> {
  const childName =
    request.context.childName

  if (
    isUrgentMedicalSituation(request)
  ) {
    return {
      possibleContext:
        buildContextSummary(request),
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

  if (isDiagnosisRequest(request)) {
    return {
      possibleContext:
        buildContextSummary(request),
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

  if (isDietPlanningRequest(request)) {
    return {
      possibleContext:
        buildContextSummary(request),
      suggestedActions: [],
      followUpQuestion:
        `What foods does ${childName} currently eat comfortably, and are there any allergies or dietary restrictions I should know about?`,
      safetyNotice:
        'I can help with practical mealtime support, but I cannot prescribe a personalised diet or replace advice from a qualified health or nutrition professional.',
    }
  }

  if (isNeutralObservation(request)) {
    return {
      possibleContext:
        buildContextSummary(request),
      suggestedActions: [],
      followUpQuestion:
        `What would you like help with about ${childName}'s situation—for example, food refusal, trying new foods, or meal planning?`,
      safetyNotice: null,
    }
  }

  if (needsMoreContext(request)) {
    return {
      possibleContext:
        buildContextSummary(request),
      suggestedActions: [],
      followUpQuestion:
        `What happened just before this started, and what is ${childName} doing right now?`,
      safetyNotice: null,
    }
  }

  const unclearFollowUp =
    isUnclearFollowUp(request)

  const conversationFocus =
    unclearFollowUp
      ? getRecentUserConversationFocus(
          request,
        )
      : null

  const messages: OllamaMessage[] = [
    {
      role: 'system',
      content: HERMES_SYSTEM_PROMPT,
    },
  ]

  const modelSessionContext =
  unclearFollowUp
    ? (request.sessionContext ?? []).filter(
        (message) =>
          message.role === 'user',
      )
    : request.sessionContext

if (modelSessionContext?.length) {
  messages.push(
    ...modelSessionContext.map(
      (message) => ({
        role: message.role,
        content: message.content,
      }),
    ),
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

${
  conversationFocus
    ? `RECENT CONVERSATION FOCUS:
${conversationFocus}

The current user message is an unclear follow-up.
Answer it as a continuation of the RECENT CONVERSATION FOCUS above.
Use the caregiver's recent USER messages to determine what the follow-up refers to.
Do not use earlier assistant suggestions to redefine the topic of the caregiver's follow-up.
Do not switch to a different topic just because known triggers or previous strategies are available.
`
    : ''
}

Child name: ${childName}
Age: ${age}
Category: ${category}

CURRENT SITUATION:
${currentSituation}

RECENT CONTEXT:
${recentContext ?? 'Not provided'}

KNOWN TRIGGERS:
${
  knownTriggers?.length
    ? knownTriggers.join(', ')
    : 'Not provided'
}

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
- If the caregiver says a substitute previously worked, explicitly recognise it as a previously successful substitute rather than presenting it as a new idea.
- A previously successful substitute may be suggested again when relevant, but clearly state that it worked previously.
- Respect every allergy or dietary restriction stated in the supplied context or recent conversation.
- Never describe an alternative food as "safe" unless the supplied context explicitly establishes that it is safe for the child.
- When suggesting packaged or prepared foods for a child with a stated allergy, remind the caregiver to check ingredient and allergen labelling rather than assuming the product is allergen-free.
- Do not ask for information already listed above.
- Do not repeat or restate the caregiver's current question in possibleContext.
- Do not infer distress, anxiety, refusal, sensory difficulty, or another problem unless the caregiver actually described it.
- A neutral observation is not evidence that something is wrong.
- If important context is missing and advice would require guessing, return no suggested actions.
- For missing-context requests, return "suggestedActions": [].
- Ask one clear follow-up question for the most useful missing detail.
- Do not give generic advice simply to fill the suggestedActions array.
- If the current message is an unclear follow-up such as "What else could I try?", "Any other ideas?", "What should I do next?" or "What should I try instead?", use the recent user conversation as the primary topic.
- For an unclear follow-up, do not switch to a general profile topic such as sensory issues, routine changes or previous strategies unless that topic is directly relevant to the recent conversation.
- Continue the caregiver's most recent problem rather than starting a new topic.
- Newer caregiver information overrides older caregiver information when they conflict.
- Treat explicit corrections beginning with words such as "actually", "no", "instead" or "now" as updates to earlier information.
- When an older message and a newer message conflict, base the current response on the newer message.
- If an older message says a food is usually accepted but a newer message says it was refused today, treat the refusal as the current fact.
- Never continue recommending something that the caregiver has just said the child currently refuses, cannot use, is allergic to or cannot tolerate.
- Do not repeat substantially the same suggestions already given earlier in sessionContext.
- A reworded version of an earlier suggestion still counts as repetition.
- Prefer materially different advice from suggestions already present in sessionContext.
- If no materially different suggestion is justified, return fewer suggestedActions rather than repeating earlier advice.
`

  messages.push({
    role: 'user',
    content: contextMessage,
  })

  const response = await fetch(
    `${OLLAMA_BASE_URL}/api/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: hermesResponseFormat,
        messages,
      }),
    },
  )

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

  const previousStrategyFilteredActions =
    removeUnadaptedPreviousStrategies(
      validated.suggestedActions,
      request,
    )

  const uniqueSuggestedActions =
    removeRepeatedActions(
      previousStrategyFilteredActions,
      request,
    )

  const refusedFoodFilteredActions =
    removeRefusedFoodSuggestions(
      uniqueSuggestedActions,
      request,
    )

  const allergyClaimFilteredActions =
    removeUnverifiedAllergyClaims(
      refusedFoodFilteredActions,
      request,
    )

  const substituteAwareActions =
    ensurePreviousSuccessfulSubstitute(
      allergyClaimFilteredActions,
      request,
    )

  const allergenFilteredActions =
    removeAllergenSuggestions(
      substituteAwareActions,
      request,
    )

  const verifiedWordingActions =
    removeUnverifiedSafeClaims(
      allergenFilteredActions,
      request,
    )

  const safeSuggestedActions =
    ensureAllergyLabelReminder(
      verifiedWordingActions,
      request,
    )

  const safeFollowUpQuestion =
    sanitizeFollowUpQuestion(
      validated.followUpQuestion,
      request,
  )

return {
  possibleContext:
    buildContextSummary(request),
  suggestedActions:
    safeSuggestedActions,
  followUpQuestion:
    safeFollowUpQuestion,
  safetyNotice:
    validated.safetyNotice ?? null,
}
}