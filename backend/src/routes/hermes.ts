import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { askHermes } from '../lib/hermesClient'
import { HttpError } from '../lib/errors'
import type { HermesRequest } from '../lib/ollama'

const router: ExpressRouter = Router()

const supportRequestSchema = z.object({
  childName: z.string().trim().min(1),
  age: z.number().nonnegative(),
  category: z.string().trim().min(1),
  currentSituation: z.string().trim().min(1),
  recentContext: z.string().trim().min(1).optional(),
  knownTriggers: z.array(z.string().trim().min(1)).optional(),
  previousStrategies: z.array(z.string().trim().min(1)).optional(),
})

/**
 * POST /api/hermes
 *
 * Accepts the frontend SupportRequest format and adapts it
 * into the internal HermesRequest used by the Ollama client.
 */
router.post('/', async (req, res, next) => {
  const parsed = supportRequestSchema.safeParse(req.body)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]

    return next(
      HttpError.badRequest(
        `Invalid Hermes request: ${issue?.path.join('.') || 'request'} ${issue?.message ?? ''}`.trim(),
      ),
    )
  }

  const hermesRequest: HermesRequest = {
    context: parsed.data,
    userMessage: parsed.data.currentSituation,
  }

  try {
    const response = await askHermes(hermesRequest)

    return res.json(response)
  } catch (error) {
    return next(error)
  }
})

export { router as hermesRouter }