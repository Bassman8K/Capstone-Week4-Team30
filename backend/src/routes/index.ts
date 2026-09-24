import { Router, type Router as ExpressRouter } from 'express'
import { hermesRouter } from './hermes'

const router: ExpressRouter = Router()

router.use('/hermes', hermesRouter)

export { router as apiRouter }