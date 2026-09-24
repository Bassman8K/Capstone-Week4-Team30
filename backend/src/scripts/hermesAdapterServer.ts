import express from 'express'
import cors from 'cors'
import { hermesRouter } from '../routes/hermes'
import { errorHandler } from '../middleware/errorHandler'

const app = express()

const PORT = Number(process.env.HERMES_ADAPTER_PORT ?? 8787)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  }),
)

app.use(express.json({ limit: '1mb' }))

app.use('/api/hermes', hermesRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.info(`Hermes local adapter running at http://localhost:${PORT}`)
})
